import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, Input, Output, EventEmitter } from '@angular/core';
import { JourneyService } from '../../services/journey.service';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { DateTimeService } from '../../date-time.service';
import { JourneyInputEvent } from '../../interfaces/journy-history';

@Component({
  selector: 'app-journey-input-container',
  templateUrl: './journey-input-container.component.html',
  styleUrls: ['./journey-input-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JourneyInputContainerComponent implements OnInit, OnDestroy {

  @Input() showToast = false;
  @Input() showJourneyLink = false;
  @Output() outEvent = new EventEmitter();

  name = '';
  _screenRes: Subscription;
  _timerTracker: Subscription;
  isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();

  constructor(public journeyService: JourneyService,
    private sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private dateTimeService: DateTimeService) { }

  ngOnInit() {
    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
        this.markForCheck();
      }
    });

    this._timerTracker = this.journeyService.getTimeTrackerAsObservable().subscribe((tracker) => {
      if (tracker.counter > -1) {
        this.journeyService.isTimerStarted = true;
        this.setTimeTracker(tracker.counter);
      } else {
        this.journeyService.isTimerStarted = false;
      }
      this.markForCheck();
    });
  }

  markForCheck() {
    this.cd.detectChanges();
  }

  timerAction(event: JourneyInputEvent) {
    if (this.showToast && !event.isStarted && !event.isDelete && !event.gotoJourney) {
      this.sharedService.presentToast('Time Entry was added to your journey');
    } else if (event.gotoJourney) {
      this.outEvent.next({gotoJourney: true});
    }
    this.journeyService.timerAction(event);
    this.markForCheck();
  }

  setTimeTracker(totalSeconds: number) {
    this.journeyService.timeTracker = totalSeconds;
    this.journeyService.timerCounter = `00:00:00`;
    if (totalSeconds > 0) {
      this.journeyService.timerCounter = this.dateTimeService.getDayTimeStringFromSec(totalSeconds);
    }
  }

  ngOnDestroy() {
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._timerTracker) {
      this._timerTracker.unsubscribe();
    }
  }
}
