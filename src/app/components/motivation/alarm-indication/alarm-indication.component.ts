import { Component, OnInit, Output, EventEmitter, OnDestroy, Input, ChangeDetectionStrategy } from '@angular/core';
import { TaskStarted, Task } from '../../../interfaces/task';
import { TasksSchedulerService } from '../../../services/tasks-scheduler.service';
import { Subscription, BehaviorSubject } from 'rxjs';
import { PopoverController } from '@ionic/angular';
import { TaskDetailsComponent } from '../task-details/task-details.component';
import { NotificationsCenterComponent } from '../../notifications-center/notifications-center.component';
import { debounceTime } from 'rxjs/operators';
import { NotificationsService } from '../../../services/notifications.service';
import { SharedService } from '../../../services/shared.service';

@Component({
  selector: 'app-alarm-indication',
  templateUrl: './alarm-indication.component.html',
  styleUrls: ['./alarm-indication.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AlarmIndicationComponent implements OnInit, OnDestroy {

  TIMER = 5000;

  @Input() isFab = false;
  @Input() isSecondFab = false;
  @Input() withBackground = false;
  @Input() withNotifications = true;
  @Output() animateEvent = new EventEmitter();

  startedTask: TaskStarted = null;
  isInnerActive = false;
  isStarted = false;
  isActiveAlert = false;
  isActiveNotif = false;
  activeAlerts: Task[] = [];
  activeNotifs = [];
  canPresent = true;
  innerTitle = '';
  innerText = '';
  isDone = false;
  isEmptyText = true;

  closeAnimationSubject = new BehaviorSubject(null);
  closeAnimation$ = this.closeAnimationSubject.asObservable();

  _taskStarted: Subscription;
  _alarmTrigger: Subscription;
  _closeAnimation: Subscription;
  _notifications: Subscription;

  constructor(private tasksSchedulerService: TasksSchedulerService,
    private popoverCtrl: PopoverController,
    private notificationsService: NotificationsService,
    private sharedService: SharedService) { }

  ngOnInit() {
    let onInit = true;

    this._closeAnimation = this.closeAnimation$
      .pipe(debounceTime(this.TIMER))
      .subscribe((res) => {
        if (res) {
          this.closeInner(res.isDone);
          this.animateEvent.next(true);
        }
    });

    this._alarmTrigger = this.tasksSchedulerService.getAlarmTriggerAsObservable()
    .subscribe((alarms) => {
      if (alarms && alarms.tasks) {
        this.activeAlerts = [];
        alarms.tasks.map((task) => {
          if (task.is_active) {
            this.activeAlerts.push(task);
          }
        });
        this.isActiveAlert = this.isStarted ? false : this.activeAlerts && this.activeAlerts.length > 0;
        this.animateEvent.next(true);
      }
    });

    this._taskStarted = this.tasksSchedulerService.getTaskStartedAsObservable()
      .subscribe((task) => {
        if (task) {
          this.startedTask = task;
          if ((!this.isStarted && task.state > 0) || task.state === 2) {
            this.isStarted = true;
            this.isActiveAlert = false;
            this.isDone = false;
            if (!onInit) {
              const category = this.tasksSchedulerService.getCategoryById(task.categoryId);
              const challenge = task.task && task.task.challenge && task.task.challenge.is_challenge ? task.task.challenge : null;
              this.innerTitle = challenge ? 'Challenge in progress' : 'Time for (category title)';
              this.innerText = challenge ? challenge.name : category ? category.name : '';
              this.animateInner();
            } else {
              this.animateEvent.next(true);
            }
          } else if (task.state === 0) {
            this.isDone = true;
            this.animateInner(true);
          }
          onInit = false;
        }
      });

      if (this.withNotifications) {
        this._notifications = this.notificationsService.getNotificationsAsObservable()
        .subscribe((notifications) => {
          this.isActiveNotif = notifications && notifications.length > 0;
          this.activeNotifs = notifications;
          this.animateEvent.next(true);
        });
      }
  }

  animateInner(isDone?: boolean) {
    this.isEmptyText = false;
    this.isInnerActive = true;
    this.animateEvent.next(true);
    this.closeAnimationSubject.next({animate: true, isDone: isDone});
  }

  closeInner(isDone?: boolean) {
    this.isInnerActive = false;
    this.animateEvent.next(true);
    if (isDone) {
      this.isStarted = false;
      this.isActiveAlert = this.activeAlerts.length > 0;
      this.isEmptyText = true;
    }
    this.isDone = false;
  }

  open(ev: Event) {
    if (!this.sharedService.eventShouldBeTrigger(ev)) {
      return;
    }
    let options = {};
    const notMobile = this.sharedService.isMobileApp() ? '' : ' notifications-center-popover-md';
    const cssClass = `notifications-center-popover${notMobile}`;
    if (this.isActiveAlert || this.isStarted) {
      if (this.isStarted) {
        const task = this.isStarted ? this.startedTask.task : this.activeAlerts[0];
        options = {
          component: TaskDetailsComponent,
          event: ev,
          componentProps: {task: task, isPopoverMode: true, showExtraButtons: {showJournal: true, showActivity: false}},
          mode: 'ios',
          cssClass: cssClass
        };
        if (!task) {
          return;
        }
      } else if (this.activeAlerts.length > 0) {
        options = {
          component: NotificationsCenterComponent,
          event: ev,
          componentProps: {activeAlerts: this.activeAlerts, isPopoverMode: true},
          mode: 'ios',
          cssClass: cssClass
        };
      } else {
        return;
      }
    } else if (this.isActiveNotif) {
      options = {
        component: NotificationsCenterComponent,
        event: ev,
        componentProps: {
          isNotifications: true,
          activeNotifs: this.activeNotifs,
          isPopoverMode: true
        },
        mode: 'ios',
        cssClass: cssClass
      };
    } else {
      return;
    }
    this.presentPopover(ev, options);
  }

  async presentPopover(ev: Event, options: any) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const popover = await this.popoverCtrl.create(options);

    popover.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
      this.animateEvent.next(true);
      if (res.data && res.data.clearNotification) {
        const notif = res.data.clearNotification;
        this.notificationsService.clearNotification(notif);
      }
    })
    .catch((error) => {
      this.canPresent = true;
      this.animateEvent.next(true);
      console.error(error);
    });
    return await popover.present();
  }

  ngOnDestroy() {
    if (this._taskStarted) {
      this._taskStarted.unsubscribe();
    }
    if (this._alarmTrigger) {
      this._alarmTrigger.unsubscribe();
    }
    if (this._closeAnimation) {
      this._closeAnimation.unsubscribe();
    }
    if (this._notifications) {
      this._notifications.unsubscribe();
    }
  }
}
