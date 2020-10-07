import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { JourneyService } from '../../services/journey.service';
import { History, Journey } from '../../interfaces/journy-history';

@Component({
  selector: 'app-journey',
  templateUrl: './journey.component.html',
  styleUrls: ['./journey.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JourneyComponent implements OnInit, OnDestroy {

  @Input() mode = 'TIME_TRACKER';

  history: History = null;
  _history: Subscription;

  constructor(private cd: ChangeDetectorRef,
    public journeyService: JourneyService) { }

  ngOnInit() {
    this.journeyService.registerToHistory();

    this._history = this.journeyService.getHistoryAsObservable().subscribe((history) => {
      this.history = history;
      this.markForCheck();
    });
  }

  markForCheck() {
    this.cd.detectChanges();
  }

  histroyAction(event) {
    const journey: Journey = event.journey;
    if (event.isSave || event.isDelete) {
      if (event.isDelete) {
        // confirm delete
      }
      this.journeyService.editAction(journey, event.isDelete);
    } else if (event.isPlay) {
      this.journeyService.timerAction({ isStarted: true, name: journey.name });
      this.markForCheck();
    }
  }

  ngOnDestroy() {
    if (this._history) {
      this._history.unsubscribe();
    }
  }
}
