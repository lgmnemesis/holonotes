import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-progress-bar-circle',
  templateUrl: './progress-bar-circle.component.html',
  styleUrls: ['./progress-bar-circle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgressBarCircleComponent implements OnInit, AfterViewInit {

  @Input() totalTime = 0 ;
  @Input()
  set timePassedSec(time: number) {
    this.time = time;
    this.setProgress(this.calcPercent(time));
  }

  time = 0;

  @ViewChild('circle', { static: true }) circleRef: ElementRef;

  circumference = 0;
  circle;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.initCircle();
    this.setProgress(this.time);
  }

  initCircle() {
    try {
      this.circle = this.circleRef.nativeElement;
      const radius = this.circle.r.baseVal.value;
      const circumference = radius * 2 * Math.PI;
      this.circumference = circumference;

      this.circle.style.strokeDasharray = `${circumference} ${circumference}`;
      this.circle.style.strokeDashoffset = `${circumference}`;
    } catch (error) {
      console.error(error);
    }
  }

  setProgress(percent) {
    if (this.circle) {
      const offset = this.circumference - percent / 100 * this.circumference;
      try {
        this.circle.style.strokeDashoffset = offset;
      } catch (error) {
        console.error(error);
      }
    }
  }

  calcPercent(time: number): number {
    return this.totalTime > 0 ? time * 100 / this.totalTime : 0;
  }
}
