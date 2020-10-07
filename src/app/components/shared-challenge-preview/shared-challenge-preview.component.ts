import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Task } from '../../interfaces/task';
import { DateTimeService } from '../../date-time.service';
import { fade, translateYDownLong } from '../../models/animations';

@Component({
  selector: 'app-shared-challenge-preview',
  templateUrl: './shared-challenge-preview.component.html',
  styleUrls: ['./shared-challenge-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYDownLong
  ]
})
export class SharedChallengePreviewComponent implements OnInit {

  @Input() sharedChallenge: Task = null;
  @Output() projectEvent = new EventEmitter();
  @Output() joinChallengeEvent = new EventEmitter();

  thisWeekGoal = null;
  inProgress = false;
  canShowContent = false;
  projectId: string = null;

  constructor(private dateTimeService: DateTimeService) { }

  ngOnInit() {
    const challenge = this.sharedChallenge && this.sharedChallenge.challenge ? this.sharedChallenge.challenge : null;
    const isNewSongEachTime = challenge && challenge.id === 'new_song_each_time';
    const learnSongPID = challenge.project && challenge.project.id ? challenge.project.id : null;
    let newSongEachTimePID = null;
    if (isNewSongEachTime) {
      const currentWeek =
      Math.floor(((this.dateTimeService.getStartOfDayInMilli() - challenge.start_day) /
        this.dateTimeService.dayInMilli) / 7);

      const weekGoal = challenge.week_goal;
      const isWeekGoal = weekGoal && weekGoal.length > currentWeek;
      this.thisWeekGoal = isWeekGoal ? weekGoal[currentWeek] : null;

      newSongEachTimePID =  this.thisWeekGoal && this.thisWeekGoal.project_id  ? this.thisWeekGoal.project_id : null;
    }
    this.projectId = learnSongPID || newSongEachTimePID;
    if (this.projectId) {
      this.projectEvent.next({projectId: this.projectId, setNavRoot: true});
    } else {
      this.projectEvent.next({projectId: null});
      this.canShowContent = true;
    }
  }

  gotoProject() {
    if (this.projectId) {
      this.projectEvent.next({projectId: this.projectId});
    }
  }

  joinChallenge() {
    this.inProgress = true;
    this.joinChallengeEvent.next({task: this.sharedChallenge});
  }
}
