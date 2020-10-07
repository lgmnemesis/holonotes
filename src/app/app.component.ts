import { Component, HostListener } from '@angular/core';
import { Platform } from '@ionic/angular';
import { SharedService } from './services/shared.service';
import { TasksSchedulerService } from './services/tasks-scheduler.service';
import { SwUpdate } from '@angular/service-worker';
import { AnalyticsService } from './services/analytics.service';
import { NotificationsService } from './services/notifications.service';
import { GoogleCalendarService } from './services/google-calendar.service';
import { NewsFeedService } from './services/news-feed.service';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  constructor(private platform: Platform,
    private sharedService: SharedService,
    private tasksSchedulerService: TasksSchedulerService,
    private swUpdate: SwUpdate,
    private analyticsService: AnalyticsService,
    private notificationsService: NotificationsService,
    private googleCalendarService: GoogleCalendarService,
    private newsFeedService: NewsFeedService,
    private authService: AuthService) {

    this.addAsApp();
    this.setIsRunningAsPWA();
    this.initializeApp();
  }

  @HostListener('window:focus', ['$event'])
  onFocus(event: any): void {
    this.analyticsService.isWindowFocus = true;
  }

  @HostListener('window:blur', ['$event'])
  onBlur(event: any): void {
    this.analyticsService.isWindowFocus = false;
  }

  initializeApp() {
    this.platform.ready().then(() => {
      this.sharedService.subsribeToNavigationEvents();
      this.subscribeToVersionUpdate();

      this.sharedService.showInfo();
      this.startInDelay();
    });
  }

  startInDelay() {
    setTimeout(() => {
      this.analyticsService.start();
      this.googleCalendarService.initClient();
    }, 5000);
    setTimeout(() => {
      this.tasksSchedulerService.start();
    }, 15000);
    setTimeout(() => {
      this.notificationsService.dispachPersistedNotifications();
    }, 20000);
    setTimeout(() => {
      if (this.authService.isLoggedIn()) {
        this.newsFeedService.init();
      }
    }, 40000);
  }

  addAsApp() {
    // 'add as app to home screen event'
    // https://developers.google.com/web/fundamentals/app-install-banners/
    try {
      window.addEventListener('beforeinstallprompt', (evt) => {
        evt.preventDefault();
        // Stash the event so it can be triggered later.
        this.sharedService.deferredPrompt = evt;
        this.sharedService.canAddAsAppSubject.next(true);
        this.analyticsService.sendCanBeAddedAsAppEvent();
      });

      window.addEventListener('appinstalled ', (evt) => {
        evt.preventDefault();
        this.sharedService.presentToast('Holonotes App installed successfully');
        this.analyticsService.sendInstalledAsAppEvent();
      });
    } catch (error) {
      console.error(error);
    }
  }

  setIsRunningAsPWA() {
    try {
      this.sharedService.setIsPwa(false);
      if (window.matchMedia('(display-mode: standalone)').matches) {
        this.sharedService.setIsPwa(true);
      }

      // For safari
      if ('standalone' in window.navigator) {
        const nav: any = window.navigator;
        if (nav.standalone) {
          this.sharedService.setIsPwa(true);
        }
      }
      this.analyticsService.sendOpenAsPWAOrWebEvent(this.sharedService.isPwa());
    } catch (error) {
      console.error(error);
    }
  }

  subscribeToVersionUpdate() {
    if (this.swUpdate.isEnabled) {
      this.swUpdate.available.subscribe((update) => {
        console.log(
          'New version is available and will be active on the next reload/refresh', update
        );
        this.notificationsService.dispachNewVersionNotification();
      });
    }
  }
}
