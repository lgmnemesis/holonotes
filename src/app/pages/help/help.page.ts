import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit, ViewChild } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { PopoverController, ModalController } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { SupportUsComponent } from '../../components/support-us/support-us.component';

@Component({
  selector: 'app-help',
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('content', {static: false}) private content: any;

  showHomeButton = true;
  _router: Subscription;
  _screenRes: Subscription;

  helpUrl = '/help';
  contactUrl = '/contact';
  supportUsUrl = '/supportus';

  navUrl = null;
  showWelcome = false;
  showContact = false;
  isSupportUsUrl = false;
  isContactUrl = false;

  felHideClass = 'hide-gl-fel-chat';  // In global.scss
  isFelHide = false;

  constructor(private router: Router,
    public sharedService: SharedService,
    public auth: AuthService,
    private popoverCtrl: PopoverController,
    private cd: ChangeDetectorRef,
    private modalCtrl: ModalController) {}

  ngOnInit() {
    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.navUrl = e.url;
        this.isSupportUsUrl = false;
        this.isContactUrl = false;
        if (e.url && e.url.match(`^${this.supportUsUrl}[#]*`)) {
          this.showWelcome = false;
          this.showContact = false;
          this.isSupportUsUrl = true;
        } else if (e.url && e.url.match(`^${this.contactUrl}[#]*`)) {
          this.showWelcome = false;
          this.showContact = true;
          this.isContactUrl = true;
        } else {
          this.showWelcome = true;
          this.showContact = true;
        }
        this.showHideFbChat();
      }
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.cd.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => {
      try {
        const els = document.getElementsByClassName('help-content-scrollbar');
        for (let index = 0; index < els.length; index++) {
          const content = els[index];
          this.sharedService.styleIonScrollbars(content);
        }
      } catch (error) {
        console.error(error);
      }
      this.initFbChat();
    }, 0);
  }

  showHideFbChat() {
    // Display/Hide facebook chat
    try {
      if (this.navUrl && (this.navUrl.match(`^${this.helpUrl}[#]*`)
        || this.navUrl.match(`^${this.contactUrl}[#]*`)
        || (this.navUrl.match(`^${this.supportUsUrl}[#]*`) && this.showContact))) {
          const fel = document.getElementById('fb-root');
          if (fel) {
            fel.classList.remove(this.felHideClass);
            this.isFelHide = false;
          }
      } else if (!this.isFelHide) {
        const fel = document.getElementById('fb-root');
        if (fel) {
          fel.classList.add(this.felHideClass);
          this.isFelHide = true;
        }
      }
      this.cd.markForCheck();
    } catch (error) {
      console.error(error);
    }
  }

  gotEventFromSupportUs() {
    if (this.isSupportUsUrl || this.isContactUrl) {
      this.content.scrollToTop(200);
      this.showContact = true;
      this.showHideFbChat();
    }
  }

  initFbChat() {
    try {
      const s = 'script';
      const id = 'facebook-jssdk';
      const fjs = document.getElementById('hn-fb-chat');
      let js;
      if (document.getElementById(id)) {
        return;
      }
      js = document.createElement(s);
      js.id = id;
      js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
      fjs.parentNode.insertBefore(js, fjs);
    } catch (error) {
      console.error(error);
    }
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

  async presentModal() {
    const modal = await this.modalCtrl.create({
      component: SupportUsComponent
    });
    return await modal.present();
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
  }
}
