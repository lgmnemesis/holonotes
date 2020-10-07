import { Component, Input, ChangeDetectionStrategy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { Challenge } from '../../interfaces/task';
import { slideXLeft } from '../../models/animations';
import { TasksSchedulerService } from '../../services/tasks-scheduler.service';
import { DateTimeService } from '../../date-time.service';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-challenge',
  templateUrl: './challenge.component.html',
  styleUrls: ['./challenge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    slideXLeft
  ]
})
export class ChallengeComponent {

  @Input()
  set challenge(challenge: Challenge) {
    this.gotChallenge(challenge);
  }
  @Input() isNewCustomChallenge = false;
  @Input() withJourney = false;
  @Input() inStartView = false;
  @Input() inTaskView = false;
  @Input() journalView = false;
  @Input() animate = true;
  @Input() inPopoverView = false;
  @Input() canSetPublic = false;
  @Output() startChallengeEvent = new EventEmitter();
  @Output() selectGoalEvent = new EventEmitter();
  @Output() gotoProjectEvent = new EventEmitter();

  internalChallenge: Challenge = null;
  step = 1;
  days;
  minDays = 1;
  maxDays = 90;
  currentDay = 1;
  currentWeek = 1;
  nameMinLength = 2;
  nameMaxLength = 100;
  goalMaxLength = 100;
  nameCanNext = false;
  durationCanNext = true;
  canNext = false;
  durationNumber = 10;
  durationError = false;
  goal = '';
  actualDays = 0;
  startDayStr = '';
  endDayStr = '';
  isDoneForToday = false;
  todayDay = this.dateTimeService.getStartOfDayInMilli();
  dayInMilli = this.dateTimeService.dayInMilli;
  currentWeekGoalText = '';
  currentWeekGoalSubText = '';
  startChallengeText = '';
  daysText = '';
  sharedChallenge: Challenge = null;
  isChallengeDone = false;

  constructor(private cd: ChangeDetectorRef,
    private tasksService: TasksService,
    private tasksSchedulerService: TasksSchedulerService,
    private dateTimeService: DateTimeService) { }

  gotChallenge(challenge: Challenge) {
    if (challenge) {
      this.actualDays = challenge.actual_days && challenge.actual_days.length || 0;
      this.days = challenge.days > 0 ? challenge.days : challenge.is_in_weeks ? 4 : 30;
      challenge.days = this.days;
      const name = challenge.name || '';
      this.nameCanNext = name.length >= this.nameMinLength && name.length <= this.nameMaxLength;
      if (!challenge.duration) {
        challenge.duration = this.tasksSchedulerService.getDurationToString(this.durationNumber);
      } else {
        this.durationNumber = this.tasksSchedulerService.getDurationInMinutes(challenge.duration);
      }

      this.currentDay = Math.floor((this.todayDay - challenge.start_day) / this.dayInMilli) + 1;
      this.startDayStr = `${new Date(challenge.start_day).toDateString()}`;
      const endDay = (challenge.start_day + (this.days * this.dayInMilli)) - this.dateTimeService.dayInMilli;
      this.endDayStr = new Date(endDay).toDateString();
      this.isChallengeDone = this.todayDay > endDay;

      if (challenge.is_in_weeks) {
        this.minDays = challenge.id === 'new_song_each_time' ? 2 : this.minDays;
        this.maxDays = 52;
        this.currentWeek = Math.floor(((this.todayDay - challenge.start_day) / this.dayInMilli) / 7) + 1;
        const endWeek = (challenge.start_day + (this.days * this.dayInMilli * 7)) - this.dateTimeService.dayInMilli;
        this.endDayStr = new Date(endWeek).toDateString();
        this.isChallengeDone = this.todayDay > endWeek;
        if (challenge.week_goal && challenge.week_goal.length > this.currentWeek - 1) {
          this.currentWeekGoalText = challenge.week_goal[this.currentWeek - 1].text;
          this.currentWeekGoalSubText =  challenge.week_goal[this.currentWeek - 1].sub_text;
        } else {
          this.currentWeekGoalText = '';
          this.currentWeekGoalSubText = '';
        }
      }
      this.startChallengeText = challenge.joined ? 'Join Challenge' : 'Start your Challenge';
      this.internalChallenge = challenge;
      this.setDaysText();
      this.checkIfDoneForToday();
      this.checkIfCanNext();
      if (challenge.shared_id) {
        this.tasksService.getSharedChallengeById(challenge.shared_id).then((shared) => {
          if (shared) {
            this.sharedChallenge = shared.challenge;
            this.cd.markForCheck();
          }
        });
      }
    }
  }

  gotoStep(step: number) {
    this.step = step;
    this.animate = true;
    this.cd.markForCheck();
  }

  checkIfDoneForToday() {
    if (this.internalChallenge.actual_days) {
      this.isDoneForToday = this.internalChallenge.actual_days.find(t => t >= this.todayDay && t < this.todayDay + this.dayInMilli) > 0;
    } else {
      this.isDoneForToday = false;
    }
  }

  toggleChallengeIsPublic() {
    this.internalChallenge.is_public = !this.internalChallenge.is_public;
  }

  startChallenge() {
    const gl = this.goal ? this.goal.trim().substring(0, this.goalMaxLength) : '';
    if (gl.length > 0) {
      this.internalChallenge.description = [];
      this.internalChallenge.description.push(gl);
    }
    this.startChallengeEvent.next(this.internalChallenge);
  }

  setChallengeTime(event: any) {
    if (event && event.detail && event.detail.value) {
      this.internalChallenge.time = event.detail.value;
    }
  }

  setName(event) {
    const value = event.detail.value;
    const name = value ? value.trim() : '';
    if (name.length >= this.nameMinLength && name.length <= this.nameMaxLength) {
      this.internalChallenge.name = name;
      this.nameCanNext = true;
    } else {
      this.nameCanNext = false;
    }
    this.checkIfCanNext();
  }

  setDuration(event) {
    const value = event.target.value;
    const numVal = Number(value);
    if (numVal > 300) {
      this.durationError = true;
      this.durationCanNext = false;
    } else {
      this.durationError = false;
      this.durationCanNext = true;
    }
    this.internalChallenge.duration = this.tasksSchedulerService.getDurationToString(numVal);
    this.checkIfCanNext();
  }

  setGoal(event) {
    const value = event.detail.value;
    this.goal = value ? value.trim() : '';
  }

  setDays(event) {
    const daysSelected = event.detail.value;
    this.internalChallenge.days = daysSelected;
    this.days = daysSelected;
    this.setDaysText();
  }

  setDaysText() {
    const inWeeks = this.internalChallenge && this.internalChallenge.is_in_weeks;
    if (inWeeks) {
      this.daysText =  this.days > 1 ? 'weeks' : 'week';
    } else {
      this.daysText = this.days > 1 ? 'days' : 'day';
    }
  }

  checkIfCanNext() {
    this.canNext = this.nameCanNext && this.durationCanNext;
    this.cd.markForCheck();
  }

  selectGoal() {
    if (!this.internalChallenge.is_in_weeks) {
      return;
    }
    const wGoal = this.internalChallenge.week_goal || [];
    wGoal[this.currentWeek - 1] = {
      project_id: '',
      text: '',
      sub_text: '',
      image: ''
    };
    this.selectGoalEvent.next({goal: wGoal});
  }

  gotoProject(id: string) {
    this.gotoProjectEvent.next({projectId: id});
  }
}
