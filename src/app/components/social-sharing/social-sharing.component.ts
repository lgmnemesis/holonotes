import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { SocialSharingService } from '../../services/social-sharing.service';
import { SocialShareParams } from '../../interfaces/social-share-params';

@Component({
  selector: 'app-social-sharing',
  templateUrl: './social-sharing.component.html',
  styleUrls: ['./social-sharing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialSharingComponent implements OnInit {

  @Input()
  set params(sp: SocialShareParams) {
    this.sparams = sp;
  }
  @Input() isHidden = false;
  @Output() shareEvent = new EventEmitter();

  sparams: SocialShareParams = null;

  constructor(private socialSharingService: SocialSharingService) { }

  ngOnInit() {
  }

  shareOnTwitter() {
    this.socialSharingService.shareOnTwitter(this.sparams);
    this.shareEvent.next(true);
  }

  shareOnFacebook() {
    this.socialSharingService.shareOnFacebook(this.sparams);
    this.shareEvent.next(true);
  }

  shareOnPinterest() {
    this.socialSharingService.shareOnPinterest(this.sparams);
    this.shareEvent.next(true);
  }

  shareOnWhatsapp() {
   this.socialSharingService.shareOnWhatsapp(this.sparams);
   this.shareEvent.next(true);
  }

  copyLink() {
    try {
      const el = <HTMLInputElement>document.querySelector('.main');
      if (this.sparams && this.sparams.linkUrl) {
        this.socialSharingService.copyLinkUrl(el, this.sparams.linkUrl);
      }
    } catch (error) {
      console.error(error);
    }
    this.shareEvent.next(true);
  }
}
