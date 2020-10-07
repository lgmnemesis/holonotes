import { Component, OnInit, OnDestroy, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { PopoverController } from '@ionic/angular';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';

@Component({
  selector: 'app-terms',
  templateUrl: './terms.page.html',
  styleUrls: ['./terms.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TermsPage implements OnInit, OnDestroy {

  showHomeButton = true;
  _screenRes: Subscription;

  constructor(private router: Router,
    public sharedService: SharedService,
    public auth: AuthService,
    private popoverCtrl: PopoverController,
    private cd: ChangeDetectorRef) {}

  ngOnInit() {
    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.cd.markForCheck();
      }
    });
  }

  notesEventHandler(event) {
    if (event.type === 'profilePage') {
      this.gotoProfile(event.event);
    } else if (event.type === 'moreOptionsPage') {
      this.presentPopover(event.event, UserProfileComponent);
    }
  }

  gotoProfile(event: Event) {
    if (this.auth.isLoggedIn()) {
      this.presentPopover(event, UserProfileComponent);
    } else {
      this.router.navigateByUrl('profile').catch((error) => {
        console.error(error);
      });
    }
  }

  async presentPopover(ev: Event, component: any) {
    const popover = await this.popoverCtrl.create({
      component: component,
      event: ev,
      translucent: false,
      mode: 'ios',
      cssClass: 'user-profile-popover'
    });
    return await popover.present();
  }

  ngOnDestroy() {
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
  }

}
