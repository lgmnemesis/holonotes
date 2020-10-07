import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import * as firebase from 'firebase/app';
import 'firebase/auth';
import { fade, heightDown, translateYUp } from '../../models/animations';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    heightDown,
    translateYUp
  ]
})
export class SignInComponent implements OnInit, OnDestroy {

  @Input() showTitle = true;
  @Input() showGuestLogin = false;
  @Input() showEmailSentMessage = true;
  @Input() isEmailAnonymous = false;
  @Output() successSigninEvent = new EventEmitter();
  @Output() loadingEvent = new EventEmitter();
  @Output() emailSentEvent = new EventEmitter();

  _user: Subscription;
  email: string;
  emailSent = false;
  errorMessage: string;
  redirectUrl: string;
  showSignIn = false;
  canSend = false;
  signInInProgress = false;
  user: User = null;

  constructor(public afAuth: AngularFireAuth,
    private router: Router,
    private authService: AuthService,
    private cd: ChangeDetectorRef,
    private analyticsService: AnalyticsService,
    private sharedService: SharedService) { }

  ngOnInit() {
    const url = this.router.url;
    this.redirectUrl = environment.firebaseSignInWithEmailLinkContinueUrl;

    this._user = this.authService.user$.subscribe((user) => {
      this.user = user;
      if (user && !user.isAnonymous) {
        this.showSignIn = false;
      } else {
        if (url.match(/^.*profile[#]*.+$/)) {
          this.confirmEmailSignIn(url);
        } else {
          this.showSignIn = true;
        }
      }
      this.cd.markForCheck();
    });
  }

  reset() {
    this.emailSent = false;
    this.errorMessage = '';
    this.showSignIn = true;
    this.signInInProgress = false;
    this.cd.markForCheck();
  }

  inputId(event) {
    this.email = event.detail.value.trim();
    if (this.email.length > 0 && !this.emailSent) {
      this.canSend = true;
    } else {
      this.canSend = false;
    }
  }

  sendOnEnter(event) {
    if (event.keyCode === 13) {
      this.sendEmailLink();
    }
  }

  async sendEmailLink() {
    this.errorMessage = '';
    if (!this.email || this.email.length === 0) {
      this.errorMessage = '"Your email address" must be a valid email.';
      this.cd.markForCheck();
      return;
    }

    this.signInInProgress = true;

    const actionCodeSettings = {
      // Redirect URL
      url: this.redirectUrl + '/profile',
      handleCodeInApp: true
    };

    try {
      await this.afAuth.sendSignInLinkToEmail(
        this.email,
        actionCodeSettings
      );
      localStorage.setItem('emailForSignIn', this.email);
      this.emailSent = true;
      this.canSend = false;
      this.analyticsService.registrationReqEvent();
    } catch (error) {
      this.errorMessage = error.message;
    }
    if (this.isEmailAnonymous) {
      await this.guestSignIn();
    }
    this.signInInProgress = false;
    this.emailSentEvent.next(true);
    this.unsubscribe();
    this.cd.markForCheck();
  }

  googleSignInClicked() {
    this.signInInProgress = true;
    this.cd.markForCheck();
    this.googleSignIn();
  }

  async googleSignIn() {
    const provider = new firebase.auth.GoogleAuthProvider();
    const cUser = await this.afAuth.currentUser;
    let result: firebase.auth.UserCredential;
    if (cUser && cUser.isAnonymous) {
      result = await cUser.linkWithPopup(provider)
        .catch((error) => {
          console.error(error);
          if (error && error.code && error.code.includes('closed-by-user')) {
            return null;
          }
          return this.googleSignInWithPopup(provider);
        });
      if (result && result.user) {
        this.authService.subscribeUser();
      }
    } else {
      result = await this.googleSignInWithPopup(provider);
    }

    if (result) {
      this.successEvent(result);
    } else {
      this.reset();
    }
  }

  googleSignInWithPopup(provider) {
    return this.afAuth.signInWithPopup(provider)
    .catch((error) => {
      console.error(error);
      return null;
    });
  }

  guestSignInClicked() {
    this.signInInProgress = true;
    this.cd.markForCheck();
    this.guestSignIn();
  }

  async guestSignIn() {
    const credential = await this.afAuth.signInAnonymously()
      .catch((error) => { console.error(error); });
    if (credential) {
      this.successEvent(credential);
    }
  }

  async confirmEmailSignIn(url: string) {
    try {
      if (await this.afAuth.isSignInWithEmailLink(url)) {
        const email = localStorage.getItem('emailForSignIn');
        // If email is missing, prompt user for it
        if (email) {
          const cUser = await this.afAuth.currentUser;
          let result: firebase.auth.UserCredential;
          if (cUser && cUser.isAnonymous) {
            const credential = firebase.auth.EmailAuthProvider.credentialWithLink(email, url);
            result = await cUser.linkWithCredential(credential)
              .catch((error) => {
                console.error('error in link:', error);
                return this.afAuth.signInWithEmailLink(email, url);
              });
            if (result && result.user) {
              this.authService.subscribeUser();
            }
          } else {
            // Signin user
            result = await this.afAuth.signInWithEmailLink(email, url);
          }
          // Remove email localStorage
          localStorage.removeItem('emailForSignIn');
          if (result && result.user) {
            this.successEvent(result);
          } else {
            this.showSignIn = true;
            this.analyticsService.registrationErrorEvent();
          }
        } else {
          this.errorMessage = 'Email is Missing. Please Enter your Email Address';
          this.showSignIn = true;
          this.analyticsService.registrationErrorEvent();
        }
      } else {
        this.showSignIn = true;
      }
    } catch (error) {
      this.errorMessage = error.message;
      this.showSignIn = true;
    }
    this.cd.markForCheck();
  }

  async successEvent(event: firebase.auth.UserCredential) {
    // If projectId is in localStorage, go to project after signing in.
    const isNewUser = event.additionalUserInfo.isNewUser;
    const user = event.user;
    this.loadingEvent.next();
    if (isNewUser) {
      this.analyticsService.sendSignUpEvent();
      this.sharedService.showInfoTriggerSubject.next({isWelcomeMessage: true});
    } else {
      this.analyticsService.sendSignInEvent();
    }
    const projectId = localStorage.getItem('projectId');
    if (projectId) {
      try {
        localStorage.removeItem('projectId');
      } catch (error) {
        console.error(error);
      }
    }

    const email = user.email;
    this.successSigninEvent.next({ user: user, email: email, projectId: projectId });
  }

  unsubscribe() {
    if (this._user) {
      this._user.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.unsubscribe();
  }
}

