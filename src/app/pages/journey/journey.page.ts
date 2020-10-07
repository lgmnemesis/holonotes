import { Component, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-journey-page',
  templateUrl: './journey.page.html',
  styleUrls: ['./journey.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JourneyPage implements AfterViewInit {

  journeyMode = 'TIME_TRACKER';

  constructor(private sharedService: SharedService) { }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#journey-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  segmentChanged(event) {
    this.journeyMode = event.detail.value;
  }
}
