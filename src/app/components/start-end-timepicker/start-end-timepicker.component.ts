import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { DateTimeService } from '../../date-time.service';

@Component({
  selector: 'app-start-end-timepicker',
  templateUrl: './start-end-timepicker.component.html',
  styleUrls: ['./start-end-timepicker.component.scss'],
})
export class StartEndTimepickerComponent implements OnInit {

  @Input() startTimeMilli = 0;
  @Input() endTimeMilli = 0;
  @Output() changeEvent = new EventEmitter();

  startTime = '';
  endTime = '';

  constructor(private dateTimeService: DateTimeService) { }

  ngOnInit() {
    if (this.startTimeMilli === 0 || this.endTimeMilli === 0) {
      const dateTime = new Date();
      this.startTimeMilli = this.endTimeMilli = dateTime.getTime();
    }
    this.setDisplayStartTime(new Date(this.startTimeMilli));
    this.setDisplayEndTime(new Date(this.endTimeMilli));
    this.sendChangeEvent();
  }

  setDisplayStartTime(dateTime: Date) {
    const hours = dateTime.getHours() < 10 ? `0${dateTime.getHours()}` : dateTime.getHours();
    const minutes = dateTime.getMinutes() < 10 ? `0${dateTime.getMinutes()}` : dateTime.getMinutes();
    this.startTime =
    `${dateTime.getMonth() + 1} ${dateTime.getDate()} ${dateTime.getFullYear()} ${hours}:${minutes}`;
  }

  setDisplayEndTime(dateTime: Date) {
    const hours = dateTime.getHours() < 10 ? `0${dateTime.getHours()}` : dateTime.getHours();
    const minutes = dateTime.getMinutes() < 10 ? `0${dateTime.getMinutes()}` : dateTime.getMinutes();
    this.endTime = `${hours}:${minutes}`;
  }

  setStartTime(event) {
    const t = event.detail.value;
    this.startTime = t;
    this.startTimeMilli = new Date(t).getTime();
    this.setEndTime({detail: {value: this.endTime}}, false);
    if (this.endTimeMilli < this.startTimeMilli) {
      this.endTimeMilli = this.startTimeMilli;
      this.setDisplayEndTime(new Date(this.endTimeMilli));
    }
    this.sendChangeEvent();
  }

  setEndTime(event, check = true) {
    const t = event.detail.value;
    this.endTime = t;
    const startOfDay = this.dateTimeService.getStartOfDayInMilli(this.startTimeMilli);
    const timeInMilli = this.getTimeInMilli(t);
    this.endTimeMilli = startOfDay + timeInMilli;
    if (check && this.startTimeMilli > this.endTimeMilli) {
      this.setDisplayStartTime(new Date(this.endTimeMilli));
    }
    this.sendChangeEvent();
  }

  getTimeInMilli(t: string) {
    return Number(t.split(':')[0]) * 60 * 60 * 1000 + Number(t.split(':')[1]) * 60 * 1000;
  }

  sendChangeEvent() {
    const ev = {
      start_time: this.startTimeMilli,
      end_time: this.endTimeMilli
    };
    this.changeEvent.next(ev);
  }
}
