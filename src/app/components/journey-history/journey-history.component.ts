import { Component, OnInit, Input, ChangeDetectionStrategy, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Journey } from '../../interfaces/journy-history';
import { heightDownFast, fade } from '../../models/animations';
import { JourneyService } from '../../services/journey.service';
import { DateTimeService } from '../../date-time.service';

@Component({
  selector: 'app-journey-history',
  templateUrl: './journey-history.component.html',
  styleUrls: ['./journey-history.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    heightDownFast,
    fade
  ]
})
export class JourneyHistoryComponent implements OnInit, OnDestroy {

  @Input() list: Journey[] = [];
  @Output() action = new EventEmitter();

  startOfDay = 0;
  totalTime = '';
  editJourney: Journey;
  canSave = false;

  constructor(private journeyService: JourneyService,
    private dateTimeService: DateTimeService) { }

  ngOnInit() {
    this.editJourney = this.journeyService.createJourney();
    this.startOfDay = this.dateTimeService.getStartOfDayInMilli(this.list[0].start_time);
    let total = 0;
    this.list.forEach(journey => {
      total += journey.end_time - journey.start_time;
    });
    const totalSeconds = Math.floor(total / 1000);
    this.totalTime = this.dateTimeService.getDayTimeStringFromSec(totalSeconds);
  }

  openItemSelected(journey: Journey) {
    this.canSave = false;
    this.editJourney = this.journeyService.createJourney();
    this.editJourney.id = journey.id;
    this.editJourney.name = journey.name;
    this.list.map(j => j.is_selected = false);
    journey.is_selected = true;
  }

  cancelSelected(journey: Journey) {
    journey.is_selected = false;
    this.canSave = false;
  }

  inputNameChange(journey: Journey, event) {
    const name = event.detail.value.trim();
    this.editJourney.name = name;
    this.checkIfCanSave(journey);
  }

  setTimePicker(journey: Journey, event) {
    this.editJourney.start_time = event.start_time;
    this.editJourney.end_time = event.end_time;
    this.checkIfCanSave(journey);
  }

  checkIfCanSave(journey: Journey) {
    this.canSave = false;
    if (this.editJourney && this.editJourney.name && this.editJourney.name.trim() !== '' &&
      (journey.name && this.editJourney.name.trim() !== journey.name.trim() ||
      this.editJourney.start_time && journey.start_time && this.editJourney.start_time !== journey.start_time ||
      this.editJourney.end_time  && journey.end_time && this.editJourney.end_time !== journey.end_time)) {
      this.canSave = true;
    }
  }

  save(journey: Journey) {
    this.doAction(journey, true, false, false);
  }

  delete(journey: Journey) {
    this.doAction(journey, false, true, false);
  }

  play(journey: Journey) {
    this.doAction(journey, false, false, true);
  }

  doAction(journey: Journey, isSave = false, isDelete = false, isPlay = false) {
    this.editJourney.is_selected = false;
    journey.is_selected = false;
    this.action.next({isSave: isSave, isDelete: isDelete, isPlay: isPlay, journey: this.editJourney});
  }

  ngOnDestroy() {
    this.list.map(j => j.is_selected = false);
  }
}
