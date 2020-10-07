import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { BehaviorSubject, Subscription } from 'rxjs';
import { slideXLeft } from '../../models/animations';
import { Router } from '@angular/router';
import { TasksSchedulerService } from '../../services/tasks-scheduler.service';
import { TasksService } from '../../services/tasks.service';
import { Challenge } from '../../interfaces/task';

@Component({
  selector: 'app-start',
  templateUrl: './start.page.html',
  styleUrls: ['./start.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    slideXLeft
  ]
})
export class StartPage implements OnInit, OnDestroy {

  activeStep = 1;
  activeStepSubject = new BehaviorSubject({step: 1});
  activeStep$ = this.activeStepSubject.asObservable();
  _allChallenges: Subscription;
  _activeStep: Subscription;
  firstChallenge: Challenge;

  constructor(public sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private tasksSchedulerService: TasksSchedulerService,
    private tasksService: TasksService) { }

  ngOnInit() {
    this.tasksSchedulerService.start();
    this._allChallenges = this.tasksService.getAllChallengesAsObservable().subscribe((challenges) => {
      this.firstChallenge = challenges.find((c) => c.id === 'first_challenge');
    });

    this._activeStep = this.activeStep$.subscribe((res) => {
      this.activeStep = res ? res.step : 1;
      this.markForCheck();
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  successSignin(event) {
    this.activeStepSubject.next({step: 2});
  }

  openChallenge() {
    this.activeStepSubject.next({step: 3});
  }

  startChallenge() {
    this.tasksService.addChallenge(this.firstChallenge).then(() => {
      this.goHome();
      this.sharedService.showInfoTriggerSubject.next({isFirstChallenge: true});
    }).catch(error => console.error(error));
  }

  skip() {
    this.goHome();
  }

  goHome(): Promise<any> {
    return this.router.navigateByUrl('home').catch((error) => {
      console.error(error);
    });
  }

  ngOnDestroy() {
    if (this._allChallenges) {
      this._allChallenges.unsubscribe();
    }
    if (this._activeStep) {
      this._activeStep.unsubscribe();
    }
  }
}
