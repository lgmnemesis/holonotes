import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Task } from '../../interfaces/task';
import { TaskDetailsComponent } from '../motivation/task-details/task-details.component';
import { ModalController, PopoverController, NavController } from '@ionic/angular';
import { ActiveNotification } from '../../interfaces/acttive-notification';
import { SharedService } from '../../services/shared.service';
import { SwUpdate } from '@angular/service-worker';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-notifications-center',
  templateUrl: './notifications-center.component.html',
  styleUrls: ['./notifications-center.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotificationsCenterComponent implements OnInit {

  @Input() activeAlerts: Task[] = [];
  @Input() activeNotifs: ActiveNotification[] = [];
  @Input() isNotifications = false;
  @Input() isPopoverMode = false;

  constructor(private modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private sharedService: SharedService,
    private swUpdate: SwUpdate,
    private cd: ChangeDetectorRef,
    private navCtrl: NavController,
    private tasksService: TasksService) { }

  ngOnInit() {
  }

  goTask(task: Task) {
    this.presentTaskModal(task);
    this.close();
  }

  runNotif(notif: ActiveNotification) {
    if (!notif) {
      return;
    }
    if (notif.type === 'new_version') {
      const message = 'Relaunching updated app...';
      this.sharedService.presentToast(message, 2000).then((toast) => {
        toast.onDidDismiss().then(() => {
          this.swUpdate.activateUpdate().then(() => {
            try {
              document.location.reload();
            } catch (error) {
              console.error(error);
            }
          }).catch((error) => console.error(error));
        }).catch((error) => console.error(error));
      }).catch((error) => console.error(error));
    } else if (notif.type === 'new_song_each_time') {
      const taskId: string = notif.extra && notif.extra.taskId ? notif.extra.taskId : null;
      if (taskId) {
        this.tasksService.getTaskById(taskId).then((task) => {
          if (task) {
            this.tasksService.myChallengesSelected = { challenge: task, mode: 'INFO' };
            this.goto('journal');
          }
        });
      }
    }
    const data = {clearNotification: notif};
    this.close(data);
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

  goto(url) {
    this.navCtrl.navigateForward(url).catch(error => console.error(error));
  }

  trackByTaskId(i: number, task: Task) {
    return task.id;
  }

  trackByNotifId(i: number, notif: ActiveNotification) {
    return notif.id;
  }

  close(data?: any) {
    if (this.isPopoverMode) {
      this.popoverCtrl.dismiss(data);
    } else {
      this.modalCtrl.dismiss(data);
    }
    this.cd.markForCheck();
  }
}
