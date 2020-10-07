import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-journey-input-container-popover',
  templateUrl: './journey-input-container-popover.component.html',
  styleUrls: ['./journey-input-container-popover.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JourneyInputContainerPopoverComponent implements OnInit {

  @Input() showToast = false;
  @Input() showJourneyLink = true;

  constructor(private popoverCtrl: PopoverController) { }

  ngOnInit() {}

  gotEvent(event) {
    if (event.gotoJourney) {
      this.close(event);
    }
  }

  close(data: any) {
    this.popoverCtrl.dismiss(data).catch(error => console.error(error));
  }

}
