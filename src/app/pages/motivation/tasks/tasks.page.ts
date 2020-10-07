import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { SharedService } from '../../../services/shared.service';
import { PopoverController, ModalController, NavController } from '@ionic/angular';
import { AuthService } from '../../../services/auth.service';
import { TasksService } from '../../../services/tasks.service';
import { Task } from '../../../interfaces/task';
import { TaskDetailsComponent } from '../../../components/motivation/task-details/task-details.component';
import { TasksSchedulerService } from '../../../services/tasks-scheduler.service';
import { UserProfileComponent } from '../../../components/user-profile/user-profile.component';
import { fade, translateXLeftLong } from '../../../models/animations';
import { DateTimeService } from '../../../date-time.service';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    translateXLeftLong,
    fade
  ]
})
export class TasksPage implements OnInit, AfterViewInit, OnDestroy {

  showHomeButton = true;
  tasks: Task[] = [];
  _screenRes: Subscription;
  _tasks: Subscription;
  _currentDay: Subscription;
  _selectingSongCategory: Subscription;
  savedCurrentDay = this.tasksSchedulerService.currentDay;
  taskStartedId = '';
  isTaskStarted = {};
  taskStartedState = -10;
  _taskStarted: Subscription;
  _tasksEvent: Subscription;
  isActiveProfileButton = false;
  canPresent = true;
  actions: Task[] = [];
  showChallengeInfoMessage = false;
  challengeInfoMessageIndication = false;
  challengeInfoMessageIndicationStore = 'c_i_m_i';
  gotItDoneAnimate = false;

  constructor(private cd: ChangeDetectorRef,
    public sharedService: SharedService,
    public authService: AuthService,
    private popoverCtrl: PopoverController,
    private tasksService: TasksService,
    private modalCtrl: ModalController,
    public tasksSchedulerService: TasksSchedulerService,
    private navCtrl: NavController,
    private dateTimeService: DateTimeService) {}

  ngOnInit() {
    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.markForCheck();
      }
    });

    this.tasksSchedulerService.start();
    const tasks$ = this.tasksService.getTasks();
    try {
      // localStorage.removeItem(this.challengeInfoMessageIndicationStore); // for testing
      this.challengeInfoMessageIndication = !!localStorage.getItem(this.challengeInfoMessageIndicationStore);
    } catch (error) {
      console.error(error);
    }
    this._tasks = tasks$.subscribe((tasks) => {
      this.tasks = tasks;
      this.setActions();
      this.markForCheck();
    });

    this._taskStarted = this.tasksSchedulerService.getTaskStartedAsObservable()
    .subscribe((task) => {
      if (task &&
        (this.taskStartedState !== task.state || this.taskStartedId !== task.task.id)) {
        this.taskStartedState = task.state;
        this.taskStartedId = task.task.id;
        this.isTaskStarted = {};
        if (task.state > 0) {
          this.isTaskStarted[task.task.id] = true;
        }
        this.markForCheck();
      }
    });

    this._currentDay = this.tasksSchedulerService.getCurrentDayAsObservable()
    .subscribe((currentDay) => {
      if (currentDay !== this.savedCurrentDay) {
        this.savedCurrentDay = currentDay;
        const clone = JSON.parse(JSON.stringify(this.tasks));
        this.tasks = Array.from(clone);
        this.setActions();
        this.markForCheck();
      }
    });

    this._selectingSongCategory = this.tasksService.selectingSongCategory$
    .subscribe((res) => {
      if (res && res.project && res.task && (res.category || (res.task.challenge && res.task.challenge.is_challenge))) {
        const withProject = true;
        this.goTask(res.task, withProject);
      }
    });

    this._tasksEvent = this.tasksService.tasksEvent$.subscribe((res) => {
      if (res && res.openNewTask) {
        this.newTask();
        this.tasksService.tasksEventSubject.next(null);
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#tasks-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  setActions() {
    this.actions = [];
    if (this.tasks) {
      this.tasks.forEach(task => {
        const isChallenge = task.challenge && task.challenge.is_challenge;
        const isLearnSong = isChallenge && task.challenge.id === 'learn_song';
        const isNewSongEachTime = isChallenge && task.challenge.id === 'new_song_each_time';
        const isMyChallenge = isChallenge && (!task.challenge.shared_id || (task.challenge.shared_id && !task.challenge.joined));
        if (isLearnSong && !task.challenge.project) {
          this.actions.push(task);
        } else if (isNewSongEachTime && isMyChallenge) {
          const currentWeek =
          Math.floor(((this.dateTimeService.getStartOfDayInMilli() - task.challenge.start_day) /
            this.dateTimeService.dayInMilli) / 7);
          if (!task.challenge.week_goal ||
            task.challenge.week_goal &&
            (task.challenge.week_goal.length <= currentWeek || !task.challenge.week_goal[currentWeek].project_id)) {
            this.actions.push(task);
          }
        }
        this.showChallengeInfoMessage = isChallenge && !this.challengeInfoMessageIndication;
      });
    }
  }

  setChallengeInfoMessageIndication() {
    this.gotItDoneAnimate = true;
    setTimeout(() => {
      this.showChallengeInfoMessage = false;
      this.markForCheck();
    }, 500);
    this.challengeInfoMessageIndication = true;
    try {
      localStorage.setItem(this.challengeInfoMessageIndicationStore, 'true');
    } catch (error) {
      console.error(error);
    }
  }

  gotIt() {
    this.setChallengeInfoMessageIndication();
  }

  selectFromLibrary(task: Task) {
    this.goto('library');
    if (task.challenge && task.challenge.id === 'new_song_each_time') {
      const wGoal = task.challenge.week_goal || [];
      const currentWeek =
      Math.floor(((this.dateTimeService.getStartOfDayInMilli() - task.challenge.start_day) /
        this.dateTimeService.dayInMilli) / 7);
      wGoal[currentWeek] = {
        project_id: '',
        text: '',
        sub_text: '',
        image: ''
      };
      task.challenge.week_goal = JSON.parse(JSON.stringify(wGoal));
    }
    const data = {
      isSelecting: true,
      project: null,
      task: task,
      category: null
    };
    this.tasksService.selectingSongCategorySubject.next(data);
  }

  notesEventHandler(event) {
    if (event.type === 'profilePage') {
      this.gotoProfile(event.event);
    }
  }

  gotoProfile(event: Event) {
    if (this.authService.isLoggedIn()) {
      this.presentPopover(event, UserProfileComponent, 'user-profile-popover');
    } else {
      this.goto('profile');
    }
  }

  gotoChallenges() {
    this.goto('journal');
  }

  gotoJourney() {
    this.goto('journey');
  }

  newChallenge() {
    this.goto('challenges');
  }

  goto(url) {
    this.navCtrl.navigateForward(url).catch(error => console.error(error));
  }

  async presentPopover(ev: Event, component: any, cssClass: string) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;
    this.isActiveProfileButton = true;

    const popover = await this.popoverCtrl.create({
      component: component,
      event: ev,
      mode: 'ios',
      cssClass: cssClass
    });

    popover.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
      this.isActiveProfileButton = false;
      this.markForCheck();
    })
    .catch((error) => {
      this.canPresent = true;
      this.isActiveProfileButton = false;
      this.markForCheck();
      console.error(error);
    });

    return await popover.present();
  }

  newTask() {
    const task: Task = this.tasksService.createTask();
    this.presentTaskModal(task);
  }

  goTask(task: Task, withProject = false) {
    this.presentTaskModal(task, withProject);
  }

  async presentTaskModal(task: Task, withProject = false) {
    const taskClone = JSON.parse(JSON.stringify(task));
    const modal = await this.modalCtrl.create({
      component: TaskDetailsComponent,
      componentProps: {task: taskClone, withProject: withProject, showExtraButtons: {showJournal: true, showActivity: false}},
      cssClass: 'task-details-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
    .then((res) => {
    })
    .catch(error => {
      console.error(error);
    });

    return await modal.present().then(() => {
    });
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  trackById(i, task: Task) {
    return task.id;
  }

  ngOnDestroy() {
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._tasks) {
      this._tasks.unsubscribe();
    }
    if (this._currentDay) {
      this._currentDay.unsubscribe();
    }
    if (this._taskStarted) {
      this._taskStarted.unsubscribe();
    }
    if (this._selectingSongCategory) {
      this._selectingSongCategory.unsubscribe();
    }
    if (this._tasksEvent) {
      this._tasksEvent.unsubscribe();
    }
  }

}
