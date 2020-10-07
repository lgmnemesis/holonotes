import { Injectable, NgZone } from '@angular/core';
import { Subscription, timer } from 'rxjs';
import { environment } from '../../environments/environment';

declare var gtag;

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  currentPath = '';
  _startTimer: Subscription;
  isWindowFocus = true;
  forceAnalytics = false;

  private TIMER = 60000;
  private timerAllreadyStarted = false;
  private wasVersionEventSent = false;

  constructor(private ngZone: NgZone) {
    if (!this.forceAnalytics && (!environment.production || environment.staging)) {
      gtag = this.gtagDisabled;
      console.log('google analytics (gtag) is disabled on development env');
    }
  }

  gtagDisabled(...all: any[]) {
    // Nothing to do here
    if (!environment.production || environment.staging) {
      console.log(all);
    }
  }

  startActiveTimer() {
    if (!this.timerAllreadyStarted) {
      this.timerAllreadyStarted = true;
      try {
        this.ngZone.runOutsideAngular(() => {
          const source = timer(this.TIMER, this.TIMER);
          this._startTimer = source.subscribe(() => {
            if (this.isWindowFocus) {
              const options = { 'page_path':  this.currentPath};
              this.gtagConfigEvent(options);
            }
          });
        });
      } catch (error) {
        console.error(error);
      }
    }
  }

  start() {
    this.startActiveTimer();
  }

  stop() {
    gtag = this.gtagDisabled;
    if (this._startTimer) {
      this._startTimer.unsubscribe();
    }
  }

  sendVersionEvent() {
    const version = environment.clientVersion;
    this.gtagEvent(version, 'clientVersion', 'clientVersion');
  }

  sendNavigationEvents(options) {
    // Sending router events to google analytics
    this.gtagConfigEvent(options);
  }

  private gtagConfigEvent(options) {
    gtag('config', 'UA-129743205-1', options);
    if (!this.wasVersionEventSent) {
      this.wasVersionEventSent = true;
      this.sendVersionEvent();
    }
  }

  private gtagEvent(name, category = 'general', label = 'general') {
    gtag('event', name,
    {
      event_category: category,
      event_label: label,
      value: 1
    });
  }

  sendSignUpEvent() {
    this.gtagEvent('signUp', 'logins', 'logins');
  }

  registrationReqEvent() {
    this.gtagEvent('registrationReq', 'logins', 'logins');
  }

  registrationErrorEvent() {
    this.gtagEvent('registrationErr', 'logins', 'logins');
  }

  sendSignInEvent() {
    this.gtagEvent('signIn', 'logins', 'logins');
  }

  sendSignOutEvent() {
    this.gtagEvent('signOut', 'logins', 'logins');
  }

  sendAddCollectionEvent() {
    this.gtagEvent('addCollection', 'userAction', 'userAction');
  }

  sendRemoveCollectionEvent() {
    this.gtagEvent('removeCollection', 'userAction', 'userAction');
  }

  sendAddProjectEvent() {
    this.gtagEvent('addProject', 'userAction', 'userAction');
  }

  sendRemoveProjectEvent() {
    this.gtagEvent('removeCollection', 'userAction', 'userAction');
  }

  sendJoinChallengeFromProjectEvent() {
    this.gtagEvent('J_CH_F_Project', 'userAction', 'userAction');
  }

  sendAddTaskEvent() {
    this.gtagEvent('addTask', 'userAction', 'userAction');
  }

  sendRemoveTaskEvent() {
    this.gtagEvent('removeTask', 'userAction', 'userAction');
  }

  sendBeginTaskEvent() {
    this.gtagEvent('beginTask', 'userAction', 'userAction');
  }

  sendDeleteAcountEvent() {
    this.gtagEvent('deleteAcount', 'logins', 'logins');
  }

  sendDeleteAnonymousAcountEvent() {
    this.gtagEvent('deleteAnonymousAcount', 'logins', 'logins');
  }

  sendShareOnEvent(socialMediaName: string) {
    this.gtagEvent('shareOn', 'userAction', socialMediaName);
  }

  sendCanBeAddedAsAppEvent() {
    this.gtagEvent('canBeAddedAsApp', 'startAction', 'startAction');
  }

  sendAddAsPWAAcceptedEvent() {
    this.gtagEvent('addPwaAccepted', 'userAction', 'userAction');
  }

  sendAddAsPWADismissedEvent() {
    this.gtagEvent('addPwaDismissed', 'userAction', 'userAction');
  }

  sendInstalledAsAppEvent() {
    this.gtagEvent('InstalledAsApp', 'userAction', 'userAction');
  }

  sendOpenAsPWAOrWebEvent(isPwa: boolean) {
    const eventName = isPwa ? 'OpenAsPWA' : 'OpenAsBrowser';
    this.gtagEvent(eventName, 'startAction', 'startAction');
  }

  sendSupportUsEvent(platform: string) {
    this.gtagEvent('suppotUs', 'userAction', platform);
  }
}
