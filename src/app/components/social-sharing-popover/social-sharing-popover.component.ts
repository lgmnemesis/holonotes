import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { SocialShareParams } from '../../interfaces/social-share-params';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-social-sharing-popover',
  templateUrl: './social-sharing-popover.component.html',
  styleUrls: ['./social-sharing-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SocialSharingPopoverComponent implements OnInit {

  @Input() params: SocialShareParams = null;

  constructor(private popoverCtrl: PopoverController) { }

  ngOnInit() {}

  shareClicked() {
    this.close();
  }

  close() {
    this.popoverCtrl.dismiss().catch(error => console.error(error));
  }
}
