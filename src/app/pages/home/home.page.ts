import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { SharedService } from '../../services/shared.service';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { Subscription, of } from 'rxjs';
import { PopoverController, NavController, ModalController } from '@ionic/angular';
import { Task } from '../../interfaces/task';
import { TasksService } from '../../services/tasks.service';
import { TasksSchedulerService } from '../../services/tasks-scheduler.service';
import { TaskDetailsComponent } from '../../components/motivation/task-details/task-details.component';
import { Router } from '@angular/router';
import { Project } from '../../interfaces/project';
import { DatabaseService } from '../../services/database.service';
import { switchMap } from 'rxjs/operators';
import { fade, heightDown, translateYDown } from '../../models/animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    heightDown,
    translateYDown
  ]
})
export class HomePage implements OnInit, AfterViewInit, OnDestroy {

  showHomeButton = true;
  showSearchBarButton = false;
  isActiveProfileButton = false;
  _screenRes: Subscription;
  canPresent = true;

  tasks: Task[] = null;
  _tasks: Subscription;
  _taskStarted: Subscription;
  _currentDay: Subscription;
  savedCurrentDay = this.tasksSchedulerService.currentDay;
  recentlyAddedFeed: Project[];
  _recentlyAddedFeed: Subscription;
  lastUpdatedFeed: Project[];
  _lastUpdatedFeed: Subscription;
  defaultCoverImg = this.sharedService.defaultCoverImg;
  isTaskStarted = {};
  _loadingSpinner: Subscription;
  isTodayTasks = false;
  isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
  _showInfoTrigger: Subscription;
  isWelcomeMessage = false;
  isFirstChallenge = false;
  _signingOut: Subscription;
  isSubscribeToAuth = false;
  isLoggedIn = false;
  _user: Subscription;
  canInstallAsApp = false;
  _canAddAsApp: Subscription;

  constructor(public authService: AuthService,
    public sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private popoverCtrl: PopoverController,
    private navCtrl: NavController,
    private tasksService: TasksService,
    private tasksSchedulerService: TasksSchedulerService,
    private modalCtrl: ModalController,
    private router: Router,
    private databaseService: DatabaseService) {}

  ngOnInit() {
    this.homeSubscriptions();
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#home-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  private homeSubscriptions() {
    this._user = this.authService.user$.subscribe((user) => {
      this.isLoggedIn = user ? true : false;
      this.isSubscribeToAuth = user === undefined ? false : true;
      this.markForCheck();
    });

    this._canAddAsApp = this.sharedService.canAddAsApp$.subscribe((canAdd) => {
      if (canAdd) {
        try {
          const can = localStorage.getItem('canAddAsApp');
          if (can !== 'false') {
            this.canInstallAsApp = true;
            this.markForCheck();
          }
        } catch (error) {
          console.error(error);
        }
      }
    });

    this.initRecentlyAddedFeed();

    this._loadingSpinner = this.sharedService.loadingSpinner$
    .subscribe((isSpinning) => {
      if (isSpinning) {
        setTimeout(() => {
          this.sharedService.unloadSpinner();
        }, 3000);
      }
    });

    setTimeout(() => {
      this.tasksSchedulerService.start();
      this.initTasks();
    }, 500);

    setTimeout(() => {
      this.initLastUpdatedProjectsFeed();
    }, 2000);

    setTimeout(() => {
      this.initOther();
    }, 10000);
  }

  initTasks() {
    const tasks$ = this.tasksService.getTasks();
    this._tasks = tasks$.subscribe((tasks) => {
      this.tasks = tasks;
      const sorted = this.tasksService.sortTasks(tasks);
      this.isTodayTasks = sorted.length > 0 && sorted[0].timeInMinutes < 1440;
      this.markForCheck();
    });


    this._taskStarted = this.tasksSchedulerService.getTaskStartedAsObservable()
    .subscribe((task) => {
      if (task) {
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
        this.markForCheck();
      }
    });
  }

  initLastUpdatedProjectsFeed() {
    const projects$ = this.authService.user$.pipe(switchMap(user => {
      if (user) {
        return this.databaseService.getMyProjectsAsObservable();
      } else {
        return of([]);
      }
    }));

    this._lastUpdatedFeed = projects$.subscribe((feed) => {
      this.lastUpdatedFeed = feed;
      this.markForCheck();
    });
  }


  initRecentlyAddedFeed() {
    this._recentlyAddedFeed = this.databaseService.getRecentlyAddedProjectsAsObservable()
    .subscribe((feed) => {
      this.recentlyAddedFeed = feed;
      this.markForCheck();
    });
  }

  initOther() {
    this._showInfoTrigger = this.sharedService.showInfoTrigger$.subscribe((info) => {
      if (info) {
        if (info.isWelcomeMessage) {
          this.isWelcomeMessage = true;
          this.sharedService.showInfoTriggerSubject.next({isWelcomeMessage: false});
        }
        if (info.isFirstChallenge) {
          this.isFirstChallenge = true;
          this.sharedService.showInfoTriggerSubject.next({isFirstChallenge: false});
        }
        this.markForCheck();
      }
    });

    this._signingOut = this.authService.signingOut$.subscribe((isSiningOut) => {
      if (isSiningOut) {
        this.isFirstChallenge = false;
        this.isWelcomeMessage = false;
      }
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
        this.markForCheck();
      }
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  gotItFirstChallenge() {
    this.isFirstChallenge = false;
    this.markForCheck();
  }

  gotItWelcomeMessage() {
    this.isWelcomeMessage = false;
    this.markForCheck();
  }

  handleWelcomeEvent(event) {
    if (event && event.signup) {
      this.gotoProfile(event);
    } else if (event && event.getStarted) {
      this.navCtrl.navigateForward('start');
    }
  }

  notesEventHandler(event) {
    if (event.type === 'profilePage') {
      this.gotoProfile(event.event);
    } else if (event.type === 'moreOptionsPage') {
      this.presentPopover(event.event, UserProfileComponent, 'user-profile-popover');
    }
  }

  gotoProfile(event: Event) {
    if (this.authService.isLoggedIn()) {
      this.presentPopover(event, UserProfileComponent, 'user-profile-popover');
    } else {
      this.navCtrl.navigateForward('profile').catch((error) => console.error(error));
    }
  }

  gotoProject(project: Project) {
    this.sharedService.setNavigatedFrom('/home');
    this.databaseService.subscribeToProjectIfOwner(project);
    this.navCtrl.navigateForward('project/' + project.id).catch((error) => console.error(error));
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

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  goTask(task: Task) {
    this.presentTaskModal(task);
  }

  async presentTaskModal(task: Task) {
    const taskClone = JSON.parse(JSON.stringify(task));
    const modal = await this.modalCtrl.create({
      component: TaskDetailsComponent,
      componentProps: {task: taskClone},
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

  go(url: string) {
    this.router.navigateByUrl(url).catch((error) => {
      console.error(error);
    });
  }

  openNewTask() {
    this.tasksService.tasksEventSubject.next({openNewTask: true});
    this.go('activity');
  }

  installAsApp() {
    this.sharedService.promptForPwaInstallation();
    this.installAppFinishAction();
  }

  cancelCanInstallAsApp() {
    this.installAppFinishAction();
  }

  installAppFinishAction() {
    this.canInstallAsApp = false;
    try {
      localStorage.setItem('canAddAsApp', 'false');
    } catch (error) {
      console.error(error);
    }
    this.markForCheck();
  }

  trackByTaskId(i, task: Task) {
    return task.id;
  }

  trackByIndex(i) {
    return i;
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
    if (this._recentlyAddedFeed) {
      this._recentlyAddedFeed.unsubscribe();
    }
    if (this._lastUpdatedFeed) {
      this._lastUpdatedFeed.unsubscribe();
    }
    if (this._taskStarted) {
      this._taskStarted.unsubscribe();
    }
    if (this._loadingSpinner) {
      this._loadingSpinner.unsubscribe();
    }
    if (this._showInfoTrigger) {
      this._showInfoTrigger.unsubscribe();
    }
    if (this._signingOut) {
      this._signingOut.unsubscribe();
    }
    if (this._user) {
      this._user.unsubscribe();
    }
    if (this._canAddAsApp) {
      this._canAddAsApp.unsubscribe();
    }
  }
}
