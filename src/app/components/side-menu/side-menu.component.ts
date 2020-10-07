import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Task } from '../../interfaces/task';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SideMenuComponent implements OnInit {

  @Input() selectedChallenge: Task = null;
  @Input() challenges: { active: Task[], completed: Task[] } = { active: [], completed: [] };
  @Input() isSmallMode = false;
  @Input() isActiveMenu = false;
  @Output() closeMenuEvent = new EventEmitter();
  @Output() selectedChallengeEvent = new EventEmitter();

  challengesToShow: Task[] = [];
  activeSelectedChallenge: Task = null;
  _screenRes: Subscription;
  isFixedPosition = false;
  isActiveChallenges = true;
  title = 'Active Challenges';

  constructor(private cd: ChangeDetectorRef) { }

    ngOnInit() {
      this.challengesToShow = this.challenges.active;
      this.activeSelectedChallenge = this.selectedChallenge;
    }

    markForCheck() {
      this.cd.detectChanges();
    }

    switchChallenge(challenge: Task) {
      if (this.selectedChallenge && this.selectedChallenge.id !== challenge.id) {
        if (this.isActiveChallenges) {
          this.activeSelectedChallenge = challenge;
        }
        this.selectedChallengeEvent.next(challenge);
      }
      this.close();
    }

    toggleActiveChallenges(event) {
      event.stopPropagation();
      this.isActiveChallenges = !this.isActiveChallenges;
      if (this.isActiveChallenges) {
        this.title = 'Active Challenges';
        this.challengesToShow = this.challenges.active;
        this.selectedChallengeEvent.next(this.activeSelectedChallenge);
      } else {
        this.title = 'Completed Challenges';
        this.challengesToShow = this.challenges.completed;
        const challenge = this.challenges.completed && this.challenges.completed.length > 0 ? this.challenges.completed[0] : null;
        if (challenge) {
          this.selectedChallengeEvent.next(challenge);
        }
      }
      this.markForCheck();
    }

    close() {
      if (this.isSmallMode) {
        this.closeMenuEvent.next(true);
        this.isFixedPosition = true;
        setTimeout(() => {
          this.isFixedPosition = false;
          this.markForCheck();
        }, 500);
      }
      this.markForCheck();
    }

    trackById(i, task: Task) {
      return task.id;
    }
}
