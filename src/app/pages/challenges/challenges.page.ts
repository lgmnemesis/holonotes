import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { TasksService } from '../../services/tasks.service';
import { Subscription, combineLatest } from 'rxjs';
import { Challenge, Task } from '../../interfaces/task';
import { environment } from '../../../environments/environment';
import { ChallengeContainerModalComponent } from '../../components/project-challenge/challenge-container-modal.component';
import { ModalController, NavController, PopoverController, LoadingController } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { tap, map, take } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Project } from '../../interfaces/project';
import { SocialSharingService } from '../../services/social-sharing.service';
import { SocialSharingPopoverComponent } from '../../components/social-sharing-popover/social-sharing-popover.component';

@Component({
  selector: 'app-challenges',
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChallengesPage implements OnInit, AfterViewInit, OnDestroy {

  _challenges: Subscription;
  _publicChallenges: Subscription;
  isNewChallenge = false;
  challenges: Challenge[] = [];
  publicChallenges: Task[] = [];
  isProduction = false;
  canPresent = true;
  yourOwnChallengeUrl = 'assets/imgs/your-own-challenge.jpg';
  isJoined = {};
  sharedChallengeLink = null;
  sharedChallenge: Task = null;
  savedProject: Project = null;
  canShow = false;

  constructor(private tasksService: TasksService,
    private modalCtrl: ModalController,
    private cd: ChangeDetectorRef,
    private navCtrl: NavController,
    private sharedService: SharedService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private socialSharingService: SocialSharingService,
    private popoverCtrl: PopoverController,
    private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.isProduction = environment.production;
    this.sharedChallengeLink = this.route.snapshot.paramMap.get('id');

    if (!this.sharedChallengeLink) {
      this.canShow = true;
    }

    this.tasksService.tasksSchedulerService.start(true);

    this._challenges = this.tasksService.getAllChallengesAsObservable().subscribe((challenges) => {
      this.challenges = challenges;
      this.markForCheck();
    });

    const tasks$ = this.tasksService.getTasks();
    // TODO: get top 10 public challenges
    const sharedCh$ = this.tasksService.getSharedChallengesAsObservable().pipe(
      map((tasks: Task[]) => {
        if (!tasks) {
          return null;
        }
        return tasks.filter((task) => {
          const isChallenge = task && task.challenge && task.challenge.is_challenge;
          const filter1 = isChallenge && !(task.challenge.dev_mode && this.isProduction);
          const filter2 = isChallenge && !(task.challenge.id === 'learn_song' && !task.challenge.project);
          return filter1 && filter2;
        });
      }),
      tap((tasks) => {
        this.publicChallenges = tasks;
        if (this.sharedChallengeLink && this.publicChallenges) {
          this.sharedChallenge = this.publicChallenges.find(t => t.id === this.sharedChallengeLink);
          if (this.sharedChallenge) {
            this.publicChallenges = tasks.filter(t => t.id !== this.sharedChallengeLink);
          }
        }
      })
    );
    this._publicChallenges = combineLatest([tasks$, sharedCh$]).subscribe(([t, s]) => {
      if (t && s) {
        this.setIsJoined(t, s);
        if (!this.sharedChallenge) {
          this.canShow = true;
        }
        this.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#challenges-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  setIsJoined(tasks: Task[], publicChallenges: Task[]) {
    if (publicChallenges && tasks) {
      this.isJoined = {};
      publicChallenges.forEach(cl => {
        const found = !!tasks.find((task) => {
          if (task.challenge && task.challenge.is_challenge) {
            return task.challenge.shared_id === cl.id;
          }
          return false;
        });
        this.isJoined[cl.id] = found;
      });
    }
  }

  openChallenge(challenge: Challenge, isJoining = false, isJoined = false) {
    if (isJoined) {
      return;
    }
    const clone: Challenge = JSON.parse(JSON.stringify(challenge));
    clone.is_public = false;
    clone.joined = isJoining;
    this.presentChallengeModal(clone);
  }

  customChallenge() {
    const challenge = this.tasksService.createChallenge();
    challenge.is_user_made = true;
    this.presentChallengeModal(challenge);
  }

  async presentChallengeModal(challenge: Challenge) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const isAnonymousLoggedIn = await this.authService.isAnonymousLoggedIn();
    const canSetPublic = this.authService.isLoggedIn() && !isAnonymousLoggedIn;
    const modal = await this.modalCtrl.create({
      component: ChallengeContainerModalComponent,
      componentProps: {challenge: challenge, animate: false, canSetPublic: canSetPublic},
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res) {
          if (res && res.data && res.data.isAdded) {
            if (this.authService.isLoggedIn()) {
              this.addChallenge(res.data.challenge).catch(error => console.error(error));
              this.navCtrl.back();
            } else {
              this.addChallengeWithLoadingSpinner(res.data.challenge);
            }
          }
        }
        this.canPresent = true;
      })
      .catch((error) => {
        console.error(error);
        this.canPresent = true;
      });

      return await modal.present().then(() => {
    });
  }

  addChallenge(challenge, showToast = true): Promise<void> {
    if (showToast) {
      this.sharedService.presentToast('Challenge was added to your activities', 3000);
    }
    return this.tasksService.addChallenge(challenge);
  }

  joinChallenge(event) {
    if (event && event.task) {
      const challenge: Challenge = JSON.parse(JSON.stringify(event.task.challenge));
      challenge.is_public = false;
      challenge.joined = true;
      this.addChallengeWithLoadingSpinner(challenge);
    }
  }

  addChallengeWithLoadingSpinner(challenge: Challenge) {
    this.presentLoading('Adding challenge to your activities...');
    this.addChallenge(challenge, false).then(() => {
      this.navCtrl.navigateForward('activity')
      .catch(error => console.error(error))
      .finally(() => {
        setTimeout(() => {
          this.sharedService.unloadSpinner();
        }, 1000);
      });
    }).catch(error => {
      this.sharedService.unloadSpinner();
      console.error(error);
    });
  }

  async presentLoading(message: string) {
    this.sharedService.loadingSpinner = await this.loadingCtrl.create({
      spinner: 'bubbles',
      message: message,
      mode: 'ios',
      translucent: true
    });
    return await this.sharedService.loadingSpinner.present();
  }

  async gotoProject(event) {
    if (event && event.projectId) {
      const project = await this.getProjectById(event.projectId);
      this.sharedService.currentProject = JSON.parse(JSON.stringify(project));
      if (event.setNavRoot) {
        this.sharedService.sharedChallenge = this.sharedChallenge;
        this.sharedService.alreadyJoinedSharedChallenge = this.isJoined[this.sharedChallenge.id];
        this.sharedService.setNavigatedFrom('/home');
        this.navCtrl.navigateRoot(`/project/${project.id}/challenges/${this.sharedChallenge.id}`).catch(error => console.error(error));
      } else {
        this.sharedService.setNavigatedFrom('/challenges/' + this.sharedChallengeLink);
        this.navCtrl.navigateForward(`/project/${project.id}`).catch(error => console.error(error));
      }
    } else {
      this.canShow = true;
      this.markForCheck();
    }
  }

  async getProjectById(id: string): Promise<Project> {
    if (!this.savedProject) {
      const project = await this.tasksService.databaseService.getSharedChallengesProjectAsObservable(id)
      .pipe(take(1)).toPromise()
      .catch((error) => console.error(error));
      if (project) {
        this.savedProject = project;
      }
    }
    return this.savedProject;
  }

  trackById(i, item) {
    return item.id;
  }

  share(event: Event, task: Task) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.presentSharePopover(event, task);
    }
  }

  async presentSharePopover(ev: Event, task: Task) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const params = this.socialSharingService.buildLinkForSharedChallenge(task);
    const modal = await this.popoverCtrl.create({
      component: SocialSharingPopoverComponent,
      componentProps: {params: params},
      cssClass: 'share-challenge-popover',
      event: ev,
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        this.canPresent = true;
      })
      .catch((error) => {
        console.error(error);
        this.canPresent = true;
      });

    return await modal.present().then(() => {
    });
  }

  ngOnDestroy() {
    if (this._challenges) {
      this._challenges.unsubscribe();
    }
    if (this._publicChallenges) {
      this._publicChallenges.unsubscribe();
    }
  }
}
