import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { SocialSharingService } from '../../services/social-sharing.service';

@Component({
  selector: 'app-help-footer',
  templateUrl: './help-footer.component.html',
  styleUrls: ['./help-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HelpFooterComponent {

  constructor(private navCtrl: NavController,
    private socialSharingService: SocialSharingService) { }

  gotoHelpPage() {
    this.goto('help');
  }

  gotoPrivacyPage() {
    this.goto('privacy');
  }

  gotoTermsPage() {
    this.goto('terms');
  }

  private goto(page: string) {
    this.navCtrl.navigateForward(page);
  }

  followOnFacebook() {
    this.socialSharingService.followOnFacebook();
  }

  followOnTwitter() {
    this.socialSharingService.followOnTwitter();
  }

  mailto() {
    this.socialSharingService.mailto();
  }
}
