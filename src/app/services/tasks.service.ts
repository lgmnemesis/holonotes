import { Injectable } from '@angular/core';
import { Task, Alarm, Category, SelectingSongCategory, Challenge, GoogleCalendarEvent } from '../interfaces/task';
import { DatabaseService } from './database.service';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { TasksSchedulerService } from './tasks-scheduler.service';
import { AnalyticsService } from './analytics.service';
import { DateTimeService } from '../date-time.service';
import { take } from 'rxjs/operators';
import { GoogleCalendarService } from './google-calendar.service';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class TasksService {

  defaultChallengeTime = '20:00';
  isDisableGoogleCalenderReminderStr: 'true' | 'false' = null;

  selectingSongCategorySubject: BehaviorSubject<SelectingSongCategory> =
    new BehaviorSubject({
      isSelecting: false,
      project: null,
      task: null,
      category: null
    });
  selectingSongCategory$ = this.selectingSongCategorySubject.asObservable();
  tasksEventSubject = new BehaviorSubject(null);
  tasksEvent$ = this.tasksEventSubject.asObservable();
  myChallengesSelected: {challenge: Task, mode: 'INFO' | 'JOURNAL'} = null;

  private _sharedChallenges: Subscription;
  private sharedChallengesSubject: BehaviorSubject<Task[]> = new BehaviorSubject(null);
  private sharedChallenges$ = this.sharedChallengesSubject.asObservable();

  private _completedTasks: Subscription;
  private completedTasksSubject = new BehaviorSubject(null);
  private completedTasks$ = this.completedTasksSubject.asObservable();

  constructor(public databaseService: DatabaseService,
    public tasksSchedulerService: TasksSchedulerService,
    private analyticsService: AnalyticsService,
    private dateTimeService: DateTimeService,
    private googleCalendarService: GoogleCalendarService,
    private sharedService: SharedService) {
  }

  startScheduler() {
    this.tasksSchedulerService.start();
  }

  getTasks(): Observable<Task[]> {
    return this.tasksSchedulerService.getTasksAsObservable();
  }

  async getTaskById(id: string): Promise<Task> {
    if (!id) {
      return null;
    }
    const tasks = await this.getTasks().pipe(take(1)).toPromise();
    return tasks.find(t => t.id === id);
  }

  getCompletedTasks(): Observable<Task[]> {
    if (!this._completedTasks) {
      // get tasks from db
      const uid = this.databaseService.getMyUserId();
      this._completedTasks = this.databaseService.getCompletedTasksByUserIdAsObservable(uid).subscribe((tasks) => {
        this.completedTasksSubject.next(tasks);
      });
    }
    return this.completedTasks$;
  }

  saveLocalCategories(categories: Category[]) {
    this.databaseService.updateUserTasksCategories(categories).catch((error) => {
      console.error(error);
    });
  }

  createTask(): Task {
    return {
      id: this.databaseService.createId(),
      name: '',
      categories_ids: [],
      alarms: [],
      is_active: false,
      challenge: this.createChallenge(false),
      is_completed: false,
      user_id: this.databaseService.getMyUserId(),
      google_calender: false
    };
  }

  createAlarm(): Alarm {
    const date = new Date();
    const hour = date.getHours();
    const minuts = date.getMinutes();
    const hourStr =  hour < 10 ? `0${hour}` : `${hour}`;
    const minutsStr = minuts < 10 ? `0${minuts}` : `${minuts}`;
    const time = `${hourStr}:${minutsStr}`;
    const isWeekStartOnSunday = this.dateTimeService.weekStartAt === 0;
    return {
      id: this.sharedService.create_UUID(),
      date: '',
      time: time,
      days: [isWeekStartOnSunday, true, true, true, true, !isWeekStartOnSunday, false]
    };
  }

  async saveTaskToDB(task: Task, isNewTask: boolean = false): Promise<void> {
    await this.databaseService.createOrSetTask(task, isNewTask)
      .catch((error) => { console.error(error); });
    this.tasksSchedulerService.checkTasksAlarms();
    if (isNewTask) {
      this.analyticsService.sendAddTaskEvent();
    }
  }

  createCategory(): Category {
    return {
      id: this.databaseService.createId(),
      name: '',
      description: '',
      type: '',
      duration: '00:10',
      is_global: false
    };
  }

  createChallenge(isChallenge: boolean = true): Challenge {
    return {
      is_challenge: isChallenge,
      name: '',
      description: [],
      journey_desc: '',
      goal: '',
      duration: null,
      start_day: this.dateTimeService.getStartOfDayInMilli(),
      days: 0,
      actual_days: [],
      days_to_finish: 0,
      all_week: false,
      is_in_weeks: false,
      time: this.defaultChallengeTime,
      completed_message: '',
      id: this.databaseService.createId(),
      is_user_made: false,
      is_public: false,
      shared_with: []
    };
  }

  createTaskFromChallenge(challenge: Challenge): Task {
    const task = this.createTask();
    task.challenge = challenge;
    if (!task.challenge.start_day) {
      task.challenge.start_day = this.dateTimeService.getStartOfDayInMilli();
    }
    return task;
  }

  addChallenge(challenge: Challenge): Promise<void> {
    const task = this.createTaskFromChallenge(challenge);
    const alarm = this.createAlarm();
    alarm.time = challenge.time || this.defaultChallengeTime;
    if (challenge.all_week) {
      alarm.days = [true, true, true, true, true, true, true];
    }
    task.alarms.push(alarm);
    task.name = challenge.name;
    return this.saveTaskToDB(task, true);
  }

  getDurationInMinutes(duration: string): number {
    return this.tasksSchedulerService.getDurationInMinutes(duration);
  }

  hoursAndMinutes(minutes: number) {
    if (!minutes || minutes < 1) {
      return '0 min';
    } else if (minutes > 60) {
      const hours = (minutes / 60);
      const rhours = Math.floor(hours);
      const mins = (hours - rhours) * 60;
      const rmins = Math.round(mins);
      const rhoursStr = rhours > 1 ? 'hours' : 'hour';
      const minsText = rmins === 0 ? '' : `${rmins} min`;
      return `${rhours} ${rhoursStr} ${minsText}`;
    }
    return `${minutes} min`;
  }

  getAllCategoriesAsObservable(): Observable<any[]> {
    return this.tasksSchedulerService.getAllCategoriesAsObservable();
  }

  getLocalCategories(): Category[] {
    return this.tasksSchedulerService.getLocalCategories() || [];
  }

  getAllCategories() {
    return this.tasksSchedulerService.categories;
  }

  getAllChallengesAsObservable(): Observable<Challenge[]> {
    return this.tasksSchedulerService.getAllChallengesAsObservable();
  }

  getLocalChallenges(): Challenge[] {
    return this.tasksSchedulerService.getLocalChallenges() || [];
  }

  getAllChallenges() {
    return this.tasksSchedulerService.challenges;
  }

  getSharedChallengeByIdAsObservable(id: string): Observable<any> {
    return this.databaseService.getSharedChallengeByIdAsObservable(id);
  }

  getSharedChallengesAsObservable(): Observable<any> {
    if (!this._sharedChallenges) {
      this._sharedChallenges = this.databaseService.getSharedChallengesAsObservable().subscribe((challenges) => {
        this.sharedChallengesSubject.next(challenges);
      });
    }
    return this.sharedChallenges$;
  }

  getSharedChallengeById(id: string): Promise<any> {
    return this.getSharedChallengeByIdAsObservable(id).pipe(take(1)).toPromise();
  }

  sortTasks(tasks: Task[]): Task[] {
    return this.tasksSchedulerService.sortTasks(tasks);
  }

  challengeTimeLeft(challenge: Challenge) {
    const tl = this.tasksSchedulerService.calcChallengeDaysOrWeeksToFinish(challenge);
    if (tl <= 0) {
      return 'Challenge Finished';
    }
    const format = challenge.is_in_weeks ? tl > 1 ? 'weeks' : 'week' : tl > 1 ? 'days' : 'day';
    return `ends in ${tl} ${format}`;
  }

  deleteTaskFromGoogleCalendar(task: Task) {
    const cloneTask: Task = JSON.parse(JSON.stringify(task));
    const finalDelete = cloneTask.alarms;
    if (finalDelete && finalDelete.length > 0 && cloneTask.google_calender && this.getGoogleCalenderReminderFlag() === 'false') {
      this.manageGoogleCalendarAlarms(cloneTask, finalDelete, null, null);
    }
  }

  checkAndSetGoogleCalender(updated: Task, current: Task) {
    if (!updated || !current || (!updated.google_calender && !current.google_calender)
      || this.getGoogleCalenderReminderFlag() === 'true') {
      return;
    }

    const updatedTask: Task = JSON.parse(JSON.stringify(updated));
    const currentTask: Task = JSON.parse(JSON.stringify(current));
    const ualarms: Alarm[] = updatedTask ? updatedTask.alarms : [];
    const calarms: Alarm[] = currentTask ? currentTask.alarms : [];
    const toDelete: Alarm[] = [];
    const toAdd: Alarm[] = [];
    const toUpdate: Alarm[] = [];
    let finalAdd: Alarm[];
    let finalDelete: Alarm[];
    let finalUpdate: Alarm[];

    if (updatedTask && !updatedTask.google_calender && currentTask && currentTask.google_calender) {
      // Removing all task entires from google calender
      finalDelete = [...currentTask.alarms];
    } else {
      calarms.forEach(ca => {
        const exists = ualarms.find(ua => ua.id === ca.id);
        if (!exists) {
          toDelete.push(ca);
        } else if (exists.time !== ca.time
          || exists.days.toString() !== ca.days.toString()
          || updatedTask && currentTask && updatedTask.name !== currentTask.name) {
          toUpdate.push(exists);
        }
      });
      ualarms.forEach(ua => {
        const exists = calarms.find(ca => ca.id === ua.id);
        if (!exists || currentTask && !currentTask.google_calender) {
          toAdd.push(ua);
        }
      });
      finalDelete = [...toDelete];
      finalAdd = [...toAdd];
      finalUpdate = [...toUpdate];
    }
    this.manageGoogleCalendarAlarms(updatedTask, finalDelete, finalAdd, finalUpdate);
  }

  manageGoogleCalendarAlarms(task: Task, finalDelete: Alarm[], finalAdd: Alarm[], finalUpdate: Alarm[]) {
    setTimeout( async () => {
      let canManageCalendar = false;
      const isConnected = this.googleCalendarService.isConnected();
      if (!isConnected) {
        const signIn = await this.googleCalendarService.signIn();
        canManageCalendar = signIn && signIn.isSignedIn;
        if (signIn && signIn.isCanceledByUser) {
          this.setDisableGoogleCalenderReminderFlag('true');
        }
      } else {
        canManageCalendar = true;
      }
      if (!canManageCalendar) {
        return;
      }
      if (finalDelete) {
        finalDelete.forEach(async (alarm) => {
          const event = this.createGoogleCalendarEventFromAlarm(task, alarm);
          event.eventId = alarm.id;
          await this.googleCalendarService.deleteEvent(event);
        });
      }
      if (finalAdd) {
        finalAdd.forEach(async (alarm) => {
          const event = this.createGoogleCalendarEventFromAlarm(task, alarm);
          await this.googleCalendarService.insertEvent(event);
        });
      }
      if (finalUpdate) {
        finalUpdate.forEach(async (alarm) => {
          const event = this.createGoogleCalendarEventFromAlarm(task, alarm);
          await this.googleCalendarService.updateEvent(event);
        });
      }
    }, 0);
  }

  createGoogleCalendarEventFromAlarm(task: Task, alarm: Alarm): GoogleCalendarEvent {
    const description = task.challenge && task.challenge.description ? task.challenge.description.join('\n') : task.name;
    const startOfDay = this.dateTimeService.getStartOfDayInMilli();
    const startTime = startOfDay + this.tasksSchedulerService.getDurationInMinutes(alarm.time) * 60 * 1000;
    const durationInMilli = this.tasksSchedulerService.getTaskDuration(task) * 60 * 1000;
    const endTime = startTime + durationInMilli;
    const byDay = [];
    alarm.days.forEach((d, index) => {
      if (d) {
        byDay.push(this.dateTimeService.days.semiShort[index]);
      }
    });
    const byDayStr = byDay.join(',');
    let until = '';
    let date = new Date(startOfDay);
    if (task.challenge && task.challenge.is_challenge) {
      const inWeeksOrInDays = task.challenge.is_in_weeks ? 7 : 1;
      const endDay = task.challenge.start_day - 86400000 + (task.challenge.days * 86400000 * inWeeksOrInDays);
      date = new Date(endDay);
    }
    const year = task.challenge && task.challenge.is_challenge ? date.getFullYear() : date.getFullYear() + 1;
    const gmonth = date.getMonth() + 1;
    const month = gmonth < 10 ? `0${gmonth}` : gmonth;
    const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
    const time = alarm.time ? `${alarm.time.split(':').join('')}00` : '010000';
    until = `${year}${month}${day}T${time}Z`;
    const recurrence = `RRULE:FREQ=YEARLY;BYDAY=${byDayStr};UNTIL=${until}`;

    return {
      eventId: alarm.id,
      summary: task.name,
      description: description,
      startTime: startTime,
      endTime: endTime,
      recurrence: recurrence
    };
  }

  setDisableGoogleCalenderReminderFlag(isDisabled: 'true' | 'false') {
    try {
      localStorage.setItem('disableGoogleCalenderReminder', isDisabled);
      this.isDisableGoogleCalenderReminderStr = isDisabled;
    } catch (error) {
      console.error(error);
    }
  }

  getGoogleCalenderReminderFlag() {
    if (this.isDisableGoogleCalenderReminderStr) {
      return this.isDisableGoogleCalenderReminderStr;
    }
    try {
      const value = localStorage.getItem('disableGoogleCalenderReminder');
      this.isDisableGoogleCalenderReminderStr = value === 'true' ? 'true' : 'false';
      return this.isDisableGoogleCalenderReminderStr;
    } catch (error) {
      console.error(error);
    }
    this.isDisableGoogleCalenderReminderStr = 'false';
    return this.isDisableGoogleCalenderReminderStr;
  }
}
