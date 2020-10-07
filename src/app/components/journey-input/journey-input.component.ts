import { Component, OnInit, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';
import { JourneyInputEvent } from '../../interfaces/journy-history';

@Component({
  selector: 'app-journey-input',
  templateUrl: './journey-input.component.html',
  styleUrls: ['./journey-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JourneyInputComponent implements OnInit {

  @Input() name = '';
  @Input() time = '00:00:00';
  @Input() isStarted = false;
  @Input() isLessThanMediumWindowWidth = false;
  @Input() showJourneyLink = false;
  @Output() changeEvent: EventEmitter<JourneyInputEvent> = new EventEmitter();

  isAddMode = false;
  startPlaceHolder = 'What are you working on?';
  addModePlaceHolder = 'What have you worked on?';
  inputPlaceHolder = this.startPlaceHolder;
  startTime = 0;
  endTime = 0;

  constructor() { }

  ngOnInit() {
  }

  toggleStart() {
    if (this.isAddMode) {
      this.isAddMode = false;
      this.inputPlaceHolder = this.startPlaceHolder;
      this.changeEvent.next({ isAddMode: true, name: this.name, start_time: this.startTime, end_time: this.endTime });
      this.name = '';
    } else {
      this.isStarted = !this.isStarted;
      this.changeEvent.next({ isStarted: this.isStarted, name: this.name });
      if (!this.isStarted) {
        this.name = '';
      }
    }
  }

  toggleAddTime() {
    if (this.isStarted) {
      // delete button
      this.changeEvent.next({ isStarted: false, isDelete: true, name: this.name });
    } else {
      this.isAddMode = !this.isAddMode;
      this.inputPlaceHolder = this.isAddMode ? this.addModePlaceHolder : this.startPlaceHolder;
    }
  }

  setInputName(event) {
    this.name = event.detail.value;
  }

  setTimePicker(event) {
    this.startTime = event.start_time;
    this.endTime = event.end_time;
  }

  gotoMyJourney() {
    this.changeEvent.next({ name: null, gotoJourney: true });
  }
}
