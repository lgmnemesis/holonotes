import { Component, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CountdownComponent implements OnInit {

  @Input() totalTime = 0 ;
  @Input()
  set timePassedSec(time: number) {
    this.calcTime(time);
  }

  hoursStr = '00';
  minutesStr = '00';
  secondsStr = '00';

  constructor() { }

  ngOnInit() {
  }

  calcTime(time: number) {
    const leftInSec = this.totalTime - time;
    const hours = Math.floor(leftInSec / 60 / 60);
    const minutes = Math.floor((leftInSec - hours * 60 * 60) / 60);
    const seconds = leftInSec - hours * 60 * 60 - minutes * 60;
    this.hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    this.minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
    this.secondsStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  }
}
