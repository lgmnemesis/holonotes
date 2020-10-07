import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PopoverController, NavController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { User } from '../../interfaces/user';
import { Router, NavigationEnd } from '@angular/router';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserProfileComponent implements OnInit, OnDestroy {

  user: User;
  _userSubsription: Subscription;
  _router: Subscription;
  isSignedIn = false;
  promptForPWA = false;
  guestAccount = '';

  constructor(public auth: AuthService,
    private router: Router,
    private popoverCtrl: PopoverController,
    private cd: ChangeDetectorRef,
    private sharedService: SharedService,
    private navCtrl: NavController) { }

  ngOnInit() {
    this._userSubsription = this.auth.user$.subscribe((user: User) => {
      if (user) {
        this.user = user;
        this.isSignedIn = true;
        this.guestAccount = '';
        if (this.sharedService.deferredPrompt) {
          this.promptForPWA = true;
        }
        if (user && user.isAnonymous) {
          this.guestAccount = ' (Guest)';
        }
      } else {
        this.isSignedIn = false;
      }
      this.cd.markForCheck();
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.popoverCtrl.dismiss().catch(error => console.error(error));
      }
    });
  }

  gotoExplore() {
    this.goto('explore');
  }

  gotoMyJourney() {
    this.goto('journey');
  }

  gotoNewsFeed() {
    this.goto('news-feed');
  }

  gotoProfile() {
    this.goto('profile');
  }

  addToHomeScreen() {
    this.sharedService.promptForPwaInstallation();
    this.popoverCtrl.dismiss().catch(error => console.error(error));
  }

  gotoHelp() {
    this.goto('help');
  }

  gotoSupportUs() {
    this.goto('supportus');
  }

  private goto(url: string) {
    this.router.navigateByUrl(url).catch((error) => {
      console.error(error);
    });
    this.popoverCtrl.dismiss().catch(error => console.error(error));
  }

  signOut() {
    this.auth.signingOutSubject.next(true);
    this.navCtrl.navigateRoot('/home')
    .then(() => {
      this.cd.markForCheck();
    })
    .catch((error) => {
      console.error(error);
    });
    this.popoverCtrl.dismiss().catch(error => console.error(error));
  }

  ngOnDestroy() {
    if (this._userSubsription) {
      this._userSubsription.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
