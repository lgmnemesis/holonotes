import { Injectable, NgZone } from '@angular/core';
import { Task, Alarm, Category, TaskStarted, Challenge, JoinedChallenges } from '../interfaces/task';
import { Observable, BehaviorSubject, of, timer, Subject, Subscription } from 'rxjs';
import { DatabaseService } from './database.service';
import { AuthService } from './auth.service';
import { switchMap, take } from 'rxjs/operators';
import { SharedService } from './shared.service';
import { JourneyService } from './journey.service';
import { DateTimeService } from '../date-time.service';
import { NotificationsService } from './notifications.service';

@Injectable({
  providedIn: 'root'
})
export class TasksSchedulerService {

  public currentDay = new Date().getDay();
  public defaultChallengeCompletedMessage = 'Good job! challenge completed, time to celebrate! Well done.';

  private TIMER = 20000;
  private LOCAL_STORAGE_TASK_ID = 'task_started_task_id';
  private LOCAL_STORAGE_CATEGORY_ID = 'task_started_category_id';

  private tasks: Task[] = null;
  private allreadyStarted = false;
  private timerAllreadyStarted = false;
  private tasksSubject: BehaviorSubject<Task[]> = new BehaviorSubject(null);
  private tasks$: Observable<Task[]> = this.tasksSubject.asObservable();
  private alarmTriggerSubject: BehaviorSubject<{task: Task, tasks: Task[]}> =
    new BehaviorSubject(null);
  private alarmTrigger$: Observable<{task: Task, tasks: Task[]}> =
    this.alarmTriggerSubject.asObservable();

  public categories: Category[] = [];
  private globalCategories: Category[] = [];
  private localCategories: Category[] = [];
  private allCategoriesSub = new BehaviorSubject([]);
  private allCategories$ = this.allCategoriesSub.asObservable();

  public challenges: Challenge[] = [];
  private globalChallenges: Challenge[] = [];
  private localChallenges: Challenge[] = [];
  private allChallengesSub = new BehaviorSubject([]);
  private allChallenges$ = this.allChallengesSub.asObservable();

  private allreadyRegistered = false;
  private currentDaySubject: BehaviorSubject<number> = new BehaviorSubject(this.currentDay);
  private currentDay$: Observable<number> = this.currentDaySubject.asObservable();

  public taskStarted: TaskStarted = null;
  private taskStartedSubject: BehaviorSubject<TaskStarted> = new BehaviorSubject(null);
  private taskStarted$: Observable<TaskStarted> = this.taskStartedSubject.asObservable();

  private subscribedToTasks = false;
  private subscribedToTasksGlobal = false;
  private subscribedToUserTasks = false;
  private _startedTaskScheduler: Subscription;
  private _tasksDb: Subscription;
  private _tasksGlobal: Subscription;
  private _userTasks: Subscription;
  private _startTimer: Subscription;

  private myJoinedChallenges: JoinedChallenges = {} ;

  constructor(private databaseService: DatabaseService,
    private authService: AuthService,
    private ngZone: NgZone,
    private sharedService: SharedService,
    private journeyService: JourneyService,
    private dateTimeService: DateTimeService,
    private notificationsService: NotificationsService) { }

  private startScheduler(resigterIfNotLoggedIn = false) {
    // Subscibe to user's tasks after user is logged in.
    const tasksDb$ = this.authService.afAuth.authState.pipe(switchMap(user => {
      if (user) {
        return this.getTasks();
      } else {
        return of([]);
      }
    }));

    this._tasksDb = tasksDb$
    .subscribe((tasks) => {
      this.tasks = tasks;
      this.tasksSubject.next(tasks);
      if (resigterIfNotLoggedIn) {
        this.register();
      }
      if (tasks && this.authService.isLoggedIn()) {
        this.sortTasks(this.tasks);
        this.alarmTriggerSubject.next({task: null, tasks: this.tasks});
        this.subscribedToTasks = true;
        this.buildMyJoinedChallenges();
        this.register();
        this.journeyService.registerToHistory();
      }
    });
  }

  buildMyJoinedChallenges() {
    if (!this.tasks) {
      return;
    }
    this.subscribeToMyJoinedChallenges();
  }

  subscribeToMyJoinedChallenges() {
    this.tasks.map((task) => {
      const isJoined = task.challenge && task.challenge.is_challenge && (task.challenge.joined || task.challenge.is_public);
      if (isJoined) {
        const sharedId = task.challenge.shared_id;
        if (sharedId && !this.myJoinedChallenges[sharedId]) {
          this.myJoinedChallenges[sharedId] = { myTask: task, sharedTask: null, subscription: null };
          const _sub = this.databaseService.getSharedChallengeByIdAsObservable(sharedId).subscribe((t: Task) => {
            this.myJoinedChallenges[sharedId].sharedTask = t;
            this.checkIfNeedToAddSharedProject(this.myJoinedChallenges[sharedId].myTask, this.myJoinedChallenges[sharedId].sharedTask);
          });
          this.myJoinedChallenges[sharedId].subscription = _sub;
        }
      }
    });
  }

  private async checkIfNeedToAddSharedProject(task: Task, sharedTask: Task) {
    if (!task || !sharedTask) {
      return null;
    }
    if (task.challenge && task.challenge.id === 'new_song_each_time') {
      const currentWeek =
        Math.floor(((this.dateTimeService.getStartOfDayInMilli() - task.challenge.start_day) /
          this.dateTimeService.dayInMilli) / 7);
      const weekGoal = task.challenge.week_goal;
      if (!weekGoal) {
        task.challenge.week_goal = [{project_id: null, text: null, sub_text: null, image: null}];
      }
      for (let i = 0; i <= currentWeek; i++) {
       if (!task.challenge.week_goal[i]) {
        task.challenge.week_goal[i] = {project_id: null, text: null, sub_text: null, image: null};
       }
      }
      let projectId = null;
      if (task.challenge.joined) {
        projectId = weekGoal && weekGoal.length > currentWeek ? task.challenge.week_goal[currentWeek].project_id : null;
      }
      if (task.challenge.joined && !projectId) {
        projectId = await this.addSharedProject(task, currentWeek);
      }
    }
  }

  async addSharedProject(task: Task, currentWeek: number, showNotif = true): Promise<string> {
    const sharedChallengeId = task.challenge.shared_id;
    let newId = null;
    const joined = this.getMyJoinedChallenges();
    const sharedChallenge: Task = joined && joined[sharedChallengeId] ? joined[sharedChallengeId].sharedTask : null;
    const weekGoalExists = sharedChallenge.challenge.week_goal && sharedChallenge.challenge.week_goal.length > currentWeek;
    const weekGoal = sharedChallenge && weekGoalExists ? sharedChallenge.challenge.week_goal[currentWeek] : null;
    const sharedProjectId = weekGoal ? weekGoal.project_id : null;
    if (sharedProjectId) {
      const sharedProject = await this.databaseService.getSharedChallengesProjectAsObservable(sharedProjectId)
      .pipe(take(1)).toPromise()
      .catch((error) => console.error(error));
      const user = await this.authService.getUser();
      if (sharedProject && sharedProject.user_id !== user.uid) {
        newId = this.databaseService.createProjectIdHash(sharedProject.id);
        this.databaseService.copyProject(sharedProject, newId);
        task.challenge.week_goal[currentWeek].project_id = newId;
        task.challenge.week_goal[currentWeek].text = sharedProject.name;
        task.challenge.week_goal[currentWeek].sub_text = sharedProject.artist;
        this.databaseService.createOrSetTask(task).catch(error => console.error(error));
        // Indicate that this week song was added to the challenge
        if (showNotif) {
          this.notificationsService.dispachNewSongEachTimeNotification(task);
        }
      }
    }
    return newId;
  }

  async getOrAddCurrectProjectIdForJoinedChallenge(projectId: string, task: Task): Promise<string> {
    const myPid = `.*_${this.authService.user.user_id}`;
    const rx = new RegExp(myPid);
    const isMyProject = projectId.match(rx);
    if (!isMyProject && task.challenge.joined && task.challenge.id === 'new_song_each_time') {
      const weekIndex = task.challenge.week_goal.findIndex((g) => {
        return g.project_id === projectId;
      });
      if (weekIndex > -1) {
        projectId = await this.addSharedProject(task, weekIndex, false);
      } else {
        return null;
      }
    }
    return projectId;
  }

  getMyJoinedChallenges() {
    return this.myJoinedChallenges;
  }

  sortTasks(tasks: Task[]): Task[] {
    if (!tasks) {
      return [];
    }
    tasks.forEach(task => {
      task.timeInMinutes = this.getUpcomingAlarm(task);
    });

    return tasks.sort((a, b) => {
      if (a.timeInMinutes < b.timeInMinutes) {
        return -1;
      }
      return 1;
    });
  }

  public stopScheduler() {
    if (this._startedTaskScheduler) {
      this._startedTaskScheduler.unsubscribe();
    }
    if (this._tasksDb) {
      this._tasksDb.unsubscribe();
    }
    if (this._userTasks) {
      this._userTasks.unsubscribe();
    }
    if (this._tasksGlobal) {
      this._tasksGlobal.unsubscribe();
    }
    if (this._startTimer) {
      this._startTimer.unsubscribe();
    }

    this.allreadyStarted = false;
    this.timerAllreadyStarted = false;
    this.allreadyRegistered = false;
    this.subscribedToTasks = false;
    this.subscribedToTasksGlobal = false;
    this.subscribedToUserTasks = false;
  }

  private getTasks(): Observable<Task[]> {
    // get tasks from db
    const uid = this.databaseService.getMyUserId();
    return this.databaseService.getTasksByUserIdAsObservable(uid);
  }

  getAlarmTriggerAsObservable(): Observable<{task: Task, tasks: Task[]}> {
    return this.alarmTrigger$;
  }

  private startTimer() {
    if (!this.timerAllreadyStarted) {
      this.timerAllreadyStarted = true;
      try {
        this.ngZone.runOutsideAngular(() => {
          const source = timer(0, this.TIMER);
          this._startTimer = source.subscribe(() => {
            this.checkTasksAlarms();
          });
        });
      } catch (error) {
        console.error(error);
      }

      this.checkAndRestartExistingTaskStarted();
    }
  }

  private getCurrentTimeInMinutes(): number {
    const date = new Date();
    return date.getHours() * 60 + date.getMinutes();
  }

  private getAlarmTimeInMinutes(day: number, alarm: Alarm) {
    const duration = this.getDurationInMinutes(alarm.time);
    return day * 1440 + duration;
  }

  private register() {
    // Register only once
    if (!this.allreadyRegistered) {
      this.allreadyRegistered = true;

      const tasksGlobal$ = this.databaseService.getTasksGlobalAsObservable();
      this._tasksGlobal = tasksGlobal$.subscribe((global) => {
        if (global) {
          this.globalCategories = global.categories;
          this.globalChallenges = global.challenges;
          this.subscribedToTasksGlobal = true;
          this.mergeCategories();
          this.mergeChallenges();
          this.checkIfCanStartTimer();
        }
      });

      const userTasks$ = this.databaseService.getUserTasksAsObservable();
      this._userTasks = userTasks$.subscribe((userTasks) => {
        if (!userTasks && this.authService.isLoggedIn()) {
          this.databaseService.createUserTasksDoc().catch((error) => {
            console.error(error);
          });
        } else {
          this.localCategories = userTasks ? userTasks.categories : [];
          this.localChallenges = userTasks ? userTasks.challenges : [];
          this.mergeCategories();
          this.mergeChallenges();

          this.subscribedToUserTasks = true;
          this.checkIfCanStartTimer();
        }
      });

    }
  }

  private mergeCategories() {
    this.categories = this.mergeGlobalAndLocal(this.globalCategories, this.localCategories);
    this.allCategoriesSub.next(this.categories);
  }

  private mergeChallenges() {
    this.challenges = this.mergeGlobalAndLocal(this.globalChallenges, this.localChallenges);
    this.allChallengesSub.next(this.challenges);
  }

  private mergeGlobalAndLocal(global: any[], local: any[]): any[] {
    const merged = [];
    const o = {};

    if (global) {
      global.forEach(v => {
        o[v.id] = v;
      });
    }

    if (local) {
      local.forEach(v => {
        o[v.id] = v;
      });
    }

    for (const p in o) {
      if (o.hasOwnProperty(p)) {
        merged.push(o[p]);
      }
    }

    return merged;
  }

  start(resigterIfNotLoggedIn = false) {
    if (!this.allreadyStarted) {
      this.stopScheduler();
      this.startScheduler(resigterIfNotLoggedIn);
      this.allreadyStarted = true;
    }
  }

  private checkIfCanStartTimer() {
    if (this.subscribedToTasks &&
      this.subscribedToTasksGlobal &&
      this.subscribedToUserTasks) {
      this.startTimer();
    }
  }

  checkTasksAlarms() {
    if (!this.tasks) {
      return;
    }
    this.currentDay = new Date().getDay();
    this.currentDaySubject.next(this.currentDay);

    const currentTimeInMinutes = this.getCurrentTimeInMinutes();

    this.tasks.forEach(task => {
      let isChanged = false;
      const taskDuration = this.getTaskDuration(task);
      const timeInMinutes = this.getUpcomingAlarm(task, taskDuration);
      if (currentTimeInMinutes >= timeInMinutes &&
        currentTimeInMinutes < timeInMinutes + taskDuration) {
        if (!task.is_active) {
          task.is_active = true;
          isChanged = true;
          const tClone = JSON.parse(JSON.stringify(this.tasks));
          this.alarmTriggerSubject.next({task: task, tasks: tClone});
        }
      } else if (task.is_active) {
        task.is_active = false;
        isChanged = true;
        const tClone = JSON.parse(JSON.stringify(this.tasks));
        this.alarmTriggerSubject.next({task: task, tasks: tClone});
      }
      if (isChanged) {
        const tClone = JSON.parse(JSON.stringify(this.tasks));
        this.tasksSubject.next(tClone);
      }
    });
  }

  stopTask(taskStarted: TaskStarted) {
    this.stopTaskAction(taskStarted);
    this.removeTaskStartedState();
    this.startedTaskAction(taskStarted.task, 0);
  }

  stopTaskAction(taskStarted: TaskStarted) {
    const task = taskStarted.task;
    this.journeyService.updateJourneyHistory(taskStarted);

    if (task.challenge && task.challenge.is_challenge) {
      const actual = task.challenge && task.challenge.actual_days || [];
      // Check if pass the 10 times limit of started this task today
      const todayDay =  this.dateTimeService.getStartOfDayInMilli();
      const started = actual.filter((t) => {
        return t === todayDay;
      });
      if (started && started.length < 10) {
        actual.push(todayDay);
        task.challenge.actual_days = actual;
        this.databaseService.createOrSetTask(task).catch(error => console.error(error));
      }

      if (task.challenge.days_to_finish > 0) {
        const unique = Array.from(new Set(actual));
        if (unique.length >= task.challenge.days_to_finish) {
          this.challengeCompleted(task);
        }
      } else {
        const daysLeft = this.calcChallengeDaysOrWeeksToFinish(task.challenge);
        if (daysLeft <= 0) {
          this.challengeCompleted(task);
        }
      }
    }
  }

  calcChallengeDaysOrWeeksToFinish(challenge: Challenge): number {
    const todayDay =  this.dateTimeService.getStartOfDayInMilli();
    const format = challenge.is_in_weeks ? 7 : 1;
    const end = (challenge.start_day +
      (challenge.days * this.dateTimeService.dayInMilli * format)) -
      this.dateTimeService.dayInMilli;
    const daysLeftInMilli = end - todayDay + this.dateTimeService.dayInMilli;
    const daysLeft = daysLeftInMilli / this.dateTimeService.dayInMilli;
    const weeksLeft = daysLeft / 7;
    return challenge.is_in_weeks ? Math.floor(weeksLeft) : Math.floor(daysLeft);
  }

  challengeCompleted(task: Task) {
    task.is_completed = true;
    const message = task.challenge.completed_message || this.defaultChallengeCompletedMessage;
    this.sharedService.presentToast(message, 7000);
    this.databaseService.createOrSetTask(task).catch(error => console.error(error));
  }

  startTask(task: Task, categoryId = '') {
    this.saveTaskStartedState(task.id, categoryId);
    this.startedTaskAction(task, 1, categoryId);
  }

  skipCategory(task: Task) {
    this.startedTaskAction(task, 2);
  }

  pauseTask(task: Task) {
    this.startedTaskAction(task, 3);
  }

  resumeTask(task: Task) {
    this.startedTaskAction(task, 4);
  }

  private startedTaskAction(task: Task, state: number, categoryId = '') {
    let timePassed = 0;
    let categoryIndex = 0;
    if (state === 2) {
      const currentIndex = task.categories_ids.findIndex((id) => {
        return id === this.taskStarted.categoryId;
      });
      if (currentIndex > -1) {
        const nextIndex = currentIndex + 1;
        if (nextIndex >= task.categories_ids.length) {
          // no more
          return;
        } else {
          this.taskStarted.categoryId = task.categories_ids[nextIndex];
          const ids = task.categories_ids.slice(0, nextIndex);
          this.taskStarted.categoryDuration =
            this.getTaskDuration(task, this.taskStarted.categoryId) * 60;
          this.taskStarted.timePassed = this.getTaskDuration(task, ids) * 60;
          this.taskStarted.categoryTimePassed = 0;
          this.taskStarted.categoryIndex = nextIndex;

          this.saveTaskStartedState(task.id, this.taskStarted.categoryId);
        }
      }
    } else if (state > 0 && categoryId === '') {
      categoryId = task.categories_ids ? task.categories_ids[0] : categoryId;
    } else if (state > 0) {
      const currentIndex = task.categories_ids.findIndex((id) => {
        return id === categoryId;
      });
      if (currentIndex > -1) {
        const ids = task.categories_ids.slice(0, currentIndex);
        timePassed = this.getTaskDuration(task, ids) * 60;
        categoryIndex = currentIndex;
      }
    }
    let started: TaskStarted = {
      task: task,
      categoryId: categoryId,
      state: state,
      duration: this.getTaskDuration(task) * 60, // In Sec
      categoryDuration: this.getTaskDuration(task, categoryId) * 60, // In Sec
      startedTime: new Date().getTime(),
      timePassed: timePassed,
      categoryTimePassed: 0,
      categoryIndex: categoryIndex
    };
    if (state > 1) { // Skip/Pause/Resume
      started = this.taskStarted;
      started.state = state === 4 ? 1 : state;
      state = started.state;
    }
    this.taskStartedSubject.next(started);
    this.taskStarted = started;

    if (this._startedTaskScheduler) {
      this._startedTaskScheduler.unsubscribe();
      if (state === 0) {
        this.taskStartedSubject.next(null);
      }
    }
    if (state > 0 && state !== 3) {
      try {
        this.ngZone.runOutsideAngular(() => {
          const source = timer(0, 1000);
          this._startedTaskScheduler = source.subscribe(() => {
            this.checkStartedTask();
          });
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  private checkStartedTask() {
    if (!this.taskStarted || this.taskStarted.state === 0) {
      this.taskStartedSubject.next(null);
      if (this._startedTaskScheduler) {
        this._startedTaskScheduler.unsubscribe();
      }
    } else if (this.taskStarted) {
      if (this.taskStarted.state === 2) {
        this.taskStarted.state = 1;
      } else {
        this.taskStarted.timePassed++;
        this.taskStarted.categoryTimePassed++;
      }
      if (this.taskStarted.timePassed > this.taskStarted.duration) {
        this.stopTask(this.taskStarted);
      } else if (this.taskStarted.categoryTimePassed > this.taskStarted.categoryDuration) {
        this.skipCategory(this.taskStarted.task);
      } else {
        this.taskStartedSubject.next(this.taskStarted);
      }
    }
  }

  getTaskStartedSubject(): Subject<TaskStarted> {
    return this.taskStartedSubject;
  }

  getTaskStartedAsObservable(): Observable<TaskStarted> {
    return this.taskStarted$;
  }

  getTasksAsObservable(): Observable<Task[]> {
    return this.tasks$;
  }

  getCurrentDayAsObservable(): Observable<number> {
    return this.currentDay$;
  }

  getAllCategoriesAsObservable(): Observable<any[]> {
    return this.allCategories$;
  }

  getLocalCategories(): Category[] {
    return this.localCategories;
  }

  getAllChallengesAsObservable(): Observable<any[]> {
    return this.allChallenges$;
  }

  getLocalChallenges(): Challenge[] {
    return this.localChallenges;
  }

  getTaskDuration(task: Task, ids = null): number {
    let total = 0;
    if (task.challenge && task.challenge.is_challenge) {
      return this.getDurationInMinutes(task.challenge.duration);
    }
    ids = ids || task.categories_ids;
    this.categories.forEach(category => {
      if (ids && ids.includes(category.id)) {
        total += this.getDurationInMinutes(category.duration);
      }
    });
    return total;
  }

  getUpcomingAlarm(task: Task, taskDuration: number = -1): number {
    const sorted = [];
    const day = this.currentDay;
    const alarms = task.alarms;
    alarms.forEach(alarm => {
      const rdays = [...alarm.days];
      for (let index = 0; index < day; index++) {
        const s = rdays.shift();
        rdays.push(s);
      }
      const isOnIndex = rdays.findIndex(isOn => isOn);
      if (isOnIndex > -1) {
        const inMinutes = this.getAlarmTimeInMinutes(isOnIndex, alarm);
        sorted.push(inMinutes);
      }
    });

    taskDuration = taskDuration === -1 ? this.getTaskDuration(task) : taskDuration;
    const currentTimeInMinutes = this.getCurrentTimeInMinutes();
    const result = sorted.sort((a, b) => a - b).find((timeInMinutes) => {
      return currentTimeInMinutes < timeInMinutes + taskDuration;
    });
    return result ? result : sorted.length > 0 ? sorted.pop() : this.dateTimeService.WEEK_IN_MINUTES;
  }

  getDurationInMinutes(duration: string): number {
    try {
      const time = duration ? duration.split(':') : [];
      return time.length !== 2 ? 0 : Number(time[0]) * 60 + Number(time[1]);
    } catch (error) {
      console.error(error);
    }
    return 0;
  }

  getDurationToString(minutes: number): string {
    let time = '00:00';
    try {
      if (minutes >= 60) {
        const hours = (minutes / 60);
        const rhours = Math.floor(hours);
        const mins = (hours - rhours) * 60;
        const rmins = Math.round(mins);
        const hoursStr = rhours < 10 ? `0${rhours}` : `${rhours}`;
        const minsStr = rmins < 10 ? `0${rmins}` : `${rmins}`;
        time = `${hoursStr}:${minsStr}`;
      } else {
        time = `00:${minutes}`;
      }
      return time;
    } catch (error) {
      console.error(error);
    }
    return '00:00';
  }

  getCategories(): Category[] {
    return this.categories;
  }

  getCategoryById(id: string) {
    return this.categories.find(category => category.id === id);
  }

  private checkAndRestartExistingTaskStarted() {
    const {id, categoryId} = this.getTaskStartedState();
    if (id) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        this.startTask(task, categoryId);
      }
    }
  }

  private getTaskStartedState(): {id: string, categoryId: string} {
    const storageTaskId = localStorage.getItem(this.LOCAL_STORAGE_TASK_ID);
    const storageCategoryId = localStorage.getItem(this.LOCAL_STORAGE_CATEGORY_ID);
    return {id: storageTaskId, categoryId: storageCategoryId};
  }

  private saveTaskStartedState(id: string, categoryId: string) {
    try {
      localStorage.setItem(this.LOCAL_STORAGE_TASK_ID, id);
      localStorage.setItem(this.LOCAL_STORAGE_CATEGORY_ID, categoryId);
    } catch (error) {
      console.error(error);
    }
  }

  private removeTaskStartedState() {
    try {
      localStorage.removeItem(this.LOCAL_STORAGE_TASK_ID);
      localStorage.removeItem(this.LOCAL_STORAGE_CATEGORY_ID);
    } catch (error) {
      console.error(error);
    }
  }
}
