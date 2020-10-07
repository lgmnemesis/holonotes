import { Injectable } from '@angular/core';
import { ActiveNotification } from '../interfaces/acttive-notification';
import { SharedService } from './shared.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Task } from '../interfaces/task';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {

  private notifications: ActiveNotification[] = [];
  private notificationsSubject: BehaviorSubject<ActiveNotification[]> =
    new BehaviorSubject([]);
  private notifications$ = this.notificationsSubject.asObservable();
  private persistedNotifications: ActiveNotification[] = [];
  private persistLocation = 'activeNotifs';

  constructor(private sharedService: SharedService) {
  }

  private createNotification(title: string, content: string): ActiveNotification {
    return {
      id: this.sharedService.generateId(),
      title: title,
      content: content,
      isPersist: false,
      isLoadedFromStore: false,
      type: 'generic'
    };
  }

  private addNotification(notification: ActiveNotification) {
    this.notifications.push(notification);
    this.notificationsSubject.next(this.notifications);
    this.persist(notification);
  }

  private persist(notification: ActiveNotification) {
    if (notification.isPersist && !notification.isLoadedFromStore) {
      this.persistedNotifications.push(notification);
      try {
        localStorage.setItem(this.persistLocation, JSON.stringify(this.persistedNotifications));
      } catch (error) {
        console.error(error);
      }
    }
  }

  private delete(notification: ActiveNotification) {
    if (notification.isPersist) {
      const filterd = this.persistedNotifications.filter(n => n.id !== notification.id);
      this.persistedNotifications = filterd;
      try {
        localStorage.setItem(this.persistLocation, JSON.stringify(this.persistedNotifications));
      } catch (error) {
        console.error(error);
      }
    }
  }

  dispachPersistedNotifications() {
    try {
      const store: ActiveNotification[] = JSON.parse(localStorage.getItem(this.persistLocation));
      if (store && store.length > 0) {
        store.forEach(notif => {
          const title = notif.title;
          const content = notif.content;
          const notification = this.createNotification(title, content);
          notification.id = notif.id;
          notification.type = notif.type;
          notification.isPersist = notif.isPersist;
          notification.isLoadedFromStore = true;
          this.addNotification(notification);
        });
      }
    } catch (error) {
      console.error(error);
    }
  }

  clearNotification(notification: ActiveNotification) {
    const filterd = this.notifications.filter(n => n.id !== notification.id);
    this.notifications = filterd;
    this.notificationsSubject.next(this.notifications);
    this.delete(notification);
  }

  getNotificationsAsObservable(): Observable<ActiveNotification[]> {
    return this.notifications$;
  }

  dispachNewVersionNotification() {
    const title = 'New version is available';
    const content = 'Tap to relaunch with updated version';
    const notification = this.createNotification(title, content);
    notification.type = 'new_version';
    this.addNotification(notification);
  }

  dispachNewSongEachTimeNotification(task: Task) {
    const title = task.name;
    const content = 'This week song was added to your challenge';
    const notification = this.createNotification(title, content);
    notification.type = 'new_song_each_time';
    notification.isPersist = true;
    notification.extra = {taskId: task.id};
    this.addNotification(notification);
  }
}
