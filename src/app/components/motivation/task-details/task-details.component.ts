import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy, Input, AfterViewInit } from '@angular/core';
import { ModalController, ActionSheetController, PopoverController, NavController } from '@ionic/angular';
import { Task, Alarm, Category, TaskStarted } from '../../../interfaces/task';
import { TasksService } from '../../../services/tasks.service';
import { TaskCategoriesComponent } from '../task-categories/task-categories.component';
import { Subscription } from 'rxjs';
import isEqual from 'lodash.isequal';
import { TasksSchedulerService } from '../../../services/tasks-scheduler.service';
import { rollUp, fade } from '../../../models/animations';
import { Router, NavigationEnd } from '@angular/router';
import { CategoryComponent } from '../category/category.component';
import { Project } from '../../../interfaces/project';
import { SharedService } from '../../../services/shared.service';
import { AnalyticsService } from '../../../services/analytics.service';
import { DateTimeService } from '../../../date-time.service';
import { SocialShareParams } from '../../../interfaces/social-share-params';
import { SocialSharingService } from '../../../services/social-sharing.service';
import { AuthService } from '../../../services/auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-task-details',
  templateUrl: './task-details.component.html',
  styleUrls: ['./task-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    rollUp,
    fade
  ]
})
export class TaskDetailsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() task: Task = null;
  @Input() isEditMode = false;
  @Input() isPopoverMode = false;
  @Input() isComponentMode = false;
  @Input() withProject = false;
  @Input() showExtraButtons = {showJournal: true, showActivity: true};
  @Input() animate = true;

  componentName = 'Routine';
  canAddTask = false;
  canSave = false;
  taskOrig: Task;
  isNewTask = false;
  leftToolbarButtonText = 'Cancel';
  rightToolbarButtonText = 'Close';
  totalDuration = '';
  allCategories: Category[] = [];
  _allCategories: Subscription;
  taskCategories: Category[] = [];
  numOfCategoriesSelectedStr = '';
  canPresent = true;
  isStartedTask = false;
  taskStarted: TaskStarted = null;
  _taskStarted: Subscription;
  currentCategoryIndex = 0;
  categoryOutOf = '';
  _selectingSongCategory: Subscription;
  _router: Subscription;
  showSocialSharing = false;
  socialSharingParams: SocialShareParams = null;
  isDisableGoogleCalenderReminderStr = this.tasksService.getGoogleCalenderReminderFlag();
  toggleGoogleCalenderChecked = false;

  constructor(private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    public tasksService: TasksService,
    private actionSheetCtrl: ActionSheetController,
    private tasksSchedulerService: TasksSchedulerService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private sharedService: SharedService,
    private navCtrl: NavController,
    private analyticsService: AnalyticsService,
    public dateTimeService: DateTimeService,
    private socialSharingService: SocialSharingService,
    public authService: AuthService,
    private location: Location) { }

  ngOnInit() {
    this.componentName = this.task && this.task.challenge && this.task.challenge.is_challenge ? 'Challenge' : 'Routine';
    this.taskOrig = this.task ? JSON.parse(JSON.stringify(this.task)) : null;
    this.isNewTask = this.task && this.task.name === '';
    if (this.isNewTask) {
      this.rightToolbarButtonText = 'Create';
      if (!this.withProject) {
        this.addAlarm();
      }
    } else if (this.isEditMode) {
      this.rightToolbarButtonText = 'Save';
    }

    this._allCategories = this.tasksService.getAllCategoriesAsObservable().subscribe((categories) => {
      this.allCategories = categories;
      this.setCategories();
      this.checkTaskStarted();
      this.markForCheck();
    });

    this._selectingSongCategory = this.tasksService.selectingSongCategory$
      .subscribe((res) => {
        if (res && res.project && res.task) {
          if (res.category) {
            this.openSelectedCategory(res.category, res.project);
          } else if (res.task.challenge && res.task.challenge.is_challenge) {
            let updatedData = null;
            if (this.task.challenge.week_goal && this.task.challenge.week_goal.length > 0) {
              const currentWeek =
                Math.floor(((this.dateTimeService.getStartOfDayInMilli() - this.task.challenge.start_day) /
                this.dateTimeService.dayInMilli) / 7);
              if (this.task.challenge.week_goal.length >= currentWeek) {
                this.task.challenge.week_goal[currentWeek] = {
                  project_id: res.project.id,
                  text: res.project.name,
                  sub_text: res.project.artist,
                  image: res.project.cover_img
                };
                updatedData = {
                  challenge: {
                    week_goal: this.task.challenge.week_goal
                  }
                };
              }
            } else {
              this.task.challenge.project = {
                id: res.project.id,
                name: res.project.name,
                artist: res.project.artist,
                imgUrl: res.project.cover_img
              };
              if (this.task.name === 'Learn a song') {
                this.task.name = `Learn to play ${res.project.name}`;
              }
              updatedData = {
                name: this.task.name,
                challenge: {
                  name: this.task.name,
                  project: this.task.challenge.project
                }
              };
            }
            res.project.is_public = this.task.challenge.is_public;
            this.task.challenge.updatedFields = {
              isUpdated: true,
              project: res.project,
              data: updatedData
            };
            this.sharedService.presentToast(`Project ${res.project.name} was added to your challenge`, 5000);
            this.save(false);
            this.taskOrig = JSON.parse(JSON.stringify(this.task));
            this.task = JSON.parse(JSON.stringify(this.taskOrig));
            this.tasksService.selectingSongCategorySubject.next(null);
            this.markForCheck();
          }
        }
      });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        setTimeout(() => {
          this.close();
        }, 0);
      }
    });

    this.socialSharingParams = this.socialSharingService.buildLinkForSharedChallenge(this.task);
  }

  ngAfterViewInit() {
    try {
      const els = document.getElementsByClassName('task-details-content-scrollbar');
      for (let index = 0; index < els.length; index++) {
        const content = els[index];
        this.sharedService.styleIonScrollbars(content);
      }
    } catch (error) {
      console.error(error);
    }
  }

  setCategories() {
    if (this.task) {
      let total = 0;

      if (this.task.challenge && this.task.challenge.is_challenge) {
        total = this.tasksService.getDurationInMinutes(this.task.challenge.duration);
      } else {
        const ids = this.task.categories_ids;
        this.taskCategories = [];
        ids.forEach(id => {
          const category = this.allCategories.find(c => c.id === id);
          if (category) {
            total += this.tasksService.getDurationInMinutes(category.duration);
            this.taskCategories.push(category);
          }
        });

        if (this.taskCategories) {
          const numOf = this.taskCategories.length;
          this.numOfCategoriesSelectedStr =
            numOf === 1 ? '1 category'
            : numOf > 1 ? `${numOf} categories` : '';
          if (this.isEditMode && numOf >= 1) {
            this.numOfCategoriesSelectedStr += ' selected';
          }
        }
      }

      this.totalDuration = this.tasksService.hoursAndMinutes(total);
    }
  }

  checkIfCanSave() {
    this.canSave = false;
    const name = this.task.name.trim();

    if (name === '') {
      this.canSave = false;
    } else if (this.isNewTask) {
      this.canSave = true;
    } else if (this.isDisableGoogleCalenderReminderStr === 'true' && this.toggleGoogleCalenderChecked) {
      this.canSave = true;
    } else {
      this.canSave = !isEqual(this.task, this.taskOrig);
    }
    this.markForCheck();
    return this.canSave;
  }

  inputId(event) {
    this.task.name = event.detail.value;
    this.checkIfCanSave();
  }

  play(event, category: Category) {
    event.stopPropagation();
    this.beginTask(category);
  }

  addAlarm() {
    const alarm = this.tasksService.createAlarm();
    if (this.task && !this.task.alarms) {
      this.task.alarms = [];
    }
    this.task.alarms.push(alarm);
    this.checkIfCanSave();
  }

  removeAlarm(index: number) {
    this.task.alarms.splice(index, 1);
    this.checkIfCanSave();
  }

  toggleDayButton(alarm: Alarm, daysIndex: number) {
    alarm.days[daysIndex] = !alarm.days[daysIndex];
    this.checkIfCanSave();
  }

  edit() {
    const taskClone = JSON.parse(JSON.stringify(this.task));
    const modalOptions = {
      component: TaskDetailsComponent,
      componentProps: {
        task: taskClone,
        isEditMode: true,
        showExtraButtons: false
      },
      cssClass: 'task-details-edit-modal',
      mode: 'ios'
    };
    this.presentModal(modalOptions);
  }

  openSelectedCategory(category: Category, project: Project = null) {
    const taskClone = JSON.parse(JSON.stringify(this.task));
    const taskStartedClone = JSON.parse(JSON.stringify(this.taskStarted));
    const modalOptions = {
      component: CategoryComponent,
      componentProps: {
        task: taskClone,
        category: category,
        taskStarted: taskStartedClone,
        project: project
      },
      cssClass: 'category-component-modal',
      mode: 'ios'
    };
    this.presentModal(modalOptions);
  }

  beginOrOpenCategories() {
    if (this.taskCategories.length > 0 || (this.task.challenge && this.task.challenge.is_challenge)) {
      this.beginTask();
    } else {
      this.openCategories();
    }
  }

  async beginTask(category?: Category) {
    const categoryId = category ? category.id : '';
    this.tasksSchedulerService.startTask(this.task, categoryId);

    if (this.taskCategories &&
      this.taskCategories.length === 1 &&
      this.taskCategories[0].type === 'custom_song' &&
      this.taskCategories[0].project_id) {
      this.gotoProject(this.taskCategories[0].project_id);
    } else if (this.task.challenge &&
      this.task.challenge.is_challenge &&
      this.task.challenge.id === 'learn_song' &&
      this.task.challenge.project) {
      this.gotoProject(this.task.challenge.project.id);
    } else if (this.task.challenge && this.task.challenge.id === 'new_song_each_time') {
      const currentWeek =
        Math.floor(((this.dateTimeService.getStartOfDayInMilli() - this.task.challenge.start_day) /
          this.dateTimeService.dayInMilli) / 7);
      if (this.task.challenge.week_goal && this.task.challenge.week_goal.length > currentWeek || !this.task.challenge.week_goal) {
        if (!this.task.challenge.week_goal) {
          this.task.challenge.week_goal = [{project_id: null, text: null, sub_text: null, image: null}];
        }
        const projectId = this.task.challenge.week_goal.length > currentWeek ? this.task.challenge.week_goal[currentWeek].project_id : null;
        this.gotoProject(projectId);
      }
    }

    this.analyticsService.sendBeginTaskEvent();
    this.checkTaskStarted();
  }

  pauseResumeTask() {
    if (this.taskStarted.state === 1) {
      this.tasksSchedulerService.pauseTask(this.task);
    } else if (this.taskStarted.state === 3) {
      this.tasksSchedulerService.resumeTask(this.task);
    }
  }

  skipCategory() {
    this.tasksSchedulerService.skipCategory(this.task);
  }

  stopTask() {
    this.tasksSchedulerService.stopTask(this.taskStarted);
  }

  async gotoProject(projectId: string) {
    projectId = await this.tasksSchedulerService.getOrAddCurrectProjectIdForJoinedChallenge(projectId, this.task);
    const db = this.tasksService.databaseService;
    if (projectId) {
      db.subscribeToProjectById(projectId);
      if (this.sharedService._currentProject) {
        this.sharedService._currentProject.unsubscribe();
      }
      this.sharedService._currentProject =
      this.sharedService.currentProject$.subscribe((project) => {
        if (project) {
          this.gotoProjectById(projectId);
          this.sharedService._currentProject.unsubscribe();
        }
      });
      this.close();
    }
  }

  gotoProjectById(id: string) {
    const path = this.location.path();
    if (path && !path.startsWith('/project')) {
      this.sharedService.setNavigatedFrom(path);
      this.navCtrl.navigateForward(`/project/${id}`)
      .catch((error) => {
        console.error(error);
      });
    } else {
      this.sharedService.setNavigatedFrom(null);
      this.navCtrl.navigateRoot(`/project/${id}`)
      .catch((error) => {
        console.error(error);
      });
    }
  }

  checkTaskStarted() {
    const task = this.tasksSchedulerService.taskStarted;
    this.isStartedTask = task && task.task.id === this.task.id && task.state > 0;
    if (this.isStartedTask) {
      if (this._taskStarted) {
        this._taskStarted.unsubscribe();
      }
      this._taskStarted = this.tasksSchedulerService.getTaskStartedAsObservable()
      .subscribe((taskStarted) => {
        if (taskStarted) {
          this.taskStarted = taskStarted;
          const total = taskStarted.task.categories_ids.length;
          const current = taskStarted.state === 0 ? total : taskStarted.categoryIndex + 1;
          this.categoryOutOf = `(${current}/${total})`;
          this.currentCategoryIndex = current;
          this.markForCheck();
        }
      });
    }
  }

  markForCheck() {
    this.cd.detectChanges();
  }

  openCategories() {
    const modalOptions = {
      component: TaskCategoriesComponent,
      componentProps: {
        task: this.task,
        taskCategories: this.taskCategories,
        isNewTask: this.isNewTask
      },
      cssClass: 'task-categories-modal',
      mode: 'ios'
    };
    this.presentModal(modalOptions);
  }

  async presentModal(modalOptions: any) {
    const modal = await this.modalCtrl.create(modalOptions);

    modal.onDidDismiss()
    .then((res) => {
      if (res && res.data) {
        if (res.data.delete) {
          // delete routine
          this.tasksService.deleteTaskFromGoogleCalendar(this.task);
          this.tasksService.databaseService.deleteTask(this.task)
          .then(() => {
            this.analyticsService.sendRemoveTaskEvent();
          })
          .catch((error) => {
            console.error(error);
          });
          // this.close(); // Bug??? trying to dismiss the same modal twice.
          setTimeout(() => { // Solution was to run it in settimeout
            this.modalCtrl.dismiss().catch((error) => console.error(error));
          });
        } else if (res.data.isCategoryModal || res.data.isChallengeModal) {
          if (res.data.closeParent) {
            setTimeout(() => {
              this.close();
            }, 0);
          } else if (res.data.playAndCloseParent) {
            const category = res.data.category;
            if (this.taskStarted && this.taskStarted.categoryId === category.id) {
              // Skip begin task. already began.
            } else {
              this.beginTask(category);
            }
            this.close();
          } else if (res.data.project) {
            try {
              const project: Project = res.data.project;
              const category = this.tasksService.createCategory();
              category.name = res.data.name;
              if (res.data.newCategory && res.data.newCategory.duration) {
                category.duration = res.data.newCategory.duration;
              }
              category.project_id = project.id;
              category.type = 'custom_song';
              const localCategories = this.tasksService.getLocalCategories();
              localCategories.push(category);
              this.tasksService.saveLocalCategories(localCategories);
              this.task.categories_ids.push(category.id);
              this.task.categories_ids =
                this.task.categories_ids.filter(id => id !== 'learn_a_song');
              this.setCategories();
            } catch (error) {
              console.error(error);
            }
          }
        } else {
          if (res.data.shouldUpdateTask) {
            this.task = res.data.task;
            this.task.timeInMinutes =
              this.tasksSchedulerService.getUpcomingAlarm(this.task);
          }
          if (res.data.taskCategories) {
            this.taskCategories = res.data.taskCategories;
            this.task.categories_ids = this.taskCategories.map(c => c.id);
            this.setCategories();
            if (res.data.closeParent) {
              setTimeout(() => {
                this.close();
              }, 0);
            }
          }
        }

        if (res.data.shouldUpdateCategories || res.data.project) {
          this.save(false);
        }

        this.taskOrig = JSON.parse(JSON.stringify(this.task));
      }
      this.markForCheck();
    })
    .catch(error => {
      console.error(error);
    });

    return await modal.present().then(() => {
    });
  }

  delete() {
    const buttons = [];
    buttons[0] = {
      text: `Delete ${this.componentName}`,
      cssClass: 'action-sheet-delete-button',
      handler: () => {
        this.close({delete: true});
      }
    };
    buttons[1] = {
      text: 'Cancel',
      handler: () => {
      }
    };
    this.presentActionSheet(buttons);
  }

  async presentActionSheet(buttons: any[]) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const actionSheet = await this.actionSheetCtrl.create({
      buttons: buttons,
      mode: 'ios',
      cssClass: 'collectios-more-action-sheet'
    });
    actionSheet.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
    })
    .catch((error) => {
      this.canPresent = true;
      console.error(error);
    });
    await actionSheet.present();
  }

  getPickerOptions(index: number) {
    return {
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Remove',
          cssClass: 'task-details-date-picker-remove',
          handler: (res) => {
            this.removeAlarm(index);
          }
        },
        {
          text: 'Done',
          handler: (res) => {
            this.task.alarms[index].time = `${res.hour.text}:${res.minute.text}`;
            this.checkIfCanSave();
          }
        }
      ]
    };
  }

  save(doClose: boolean = true) {
    let data = null;

    // filter duplicated alarms
    const alarms = this.task.alarms;
    const o = {};
    alarms.forEach(alarm => {
      const merged = [alarm.time, ...alarm.days].join();
      o[merged] = alarm;
    });
    this.task.alarms = Object.values(o);

    if (this.checkIfCanSave()) {
      data = {
        task: this.task,
        shouldUpdateTask: true
      };

      const current = this.isNewTask ? null : this.taskOrig;
      if ((current && !current.google_calender && this.task.google_calender && this.task.alarms)
        || (this.isDisableGoogleCalenderReminderStr === 'true' && this.toggleGoogleCalenderChecked)) {
        this.task.alarms.forEach(alarm => {
          alarm.id = this.sharedService.create_UUID();
        });
        if (this.isDisableGoogleCalenderReminderStr === 'true') {
          this.tasksService.setDisableGoogleCalenderReminderFlag('false');
          if (this.toggleGoogleCalenderChecked && this.task.alarms) {
            this.task.google_calender = true;
          }
        }
      }

      this.tasksService.checkAndSetGoogleCalender(this.task, current);
      this.tasksService.saveTaskToDB(this.task, this.isNewTask);
    }
    if (doClose) {
      this.close(data);
    }
  }

  gotoTasks() {
    this.goto('activity');
  }

  gotoJourney() {
    this.goto('journey');
  }

  gotoMyChallenges() {
    this.tasksService.myChallengesSelected = { challenge: this.task, mode: 'JOURNAL' };
    this.goto('journal');
  }

  toggleShareChallengeButton() {
    this.showSocialSharing = !this.showSocialSharing;
    this.markForCheck();
  }

  toggleGoogleCalender(event) {
    this.toggleGoogleCalenderChecked = event.detail.checked;
    if (this.isDisableGoogleCalenderReminderStr === 'false') {
      this.task.google_calender = !this.task.google_calender;
    }
    this.checkIfCanSave();
  }

  goto(url: string) {
    const path = this.location.path();
    if (path.startsWith('/project')) {
      this.sharedService.setNavigatedFrom(path);
    }
    this.router.navigateByUrl(url).catch((error) => {
      console.error(error);
    });
    this.close({isRouteAction: true});
  }

  selectFromLibrary(event) {
    this.router.navigateByUrl('/library')
    .catch((error) => {
      console.error(error);
    });
    if (event.goal && event.goal.length > 0) {
      this.task.challenge.week_goal = event.goal;
    }
    this.close({isChallengeModal: true, closeParent: true});
    this.tasksService.selectingSongCategorySubject.next({
      isSelecting: true,
      project: null,
      task: this.task,
      category: null
    });
  }

  close(data?: any) {
    if (this.isPopoverMode) {
      this.popoverCtrl.dismiss(data).catch((error) => console.error(error));
    } else if (!this.isComponentMode) {
      this.modalCtrl.dismiss(data).catch((error) => console.error(error));
    }
  }

  trackByCategoryId(i, category: Category) {
    return category.id;
  }

  ngOnDestroy() {
    if (this._allCategories) {
      this._allCategories.unsubscribe();
    }
    if (this._taskStarted) {
      this._taskStarted.unsubscribe();
    }
    if (this._selectingSongCategory) {
      this._selectingSongCategory.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
