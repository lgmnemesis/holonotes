import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef, ViewChild, AfterViewInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { Subscription } from 'rxjs';
import { TasksService } from '../../services/tasks.service';
import { Task } from '../../interfaces/task';
import { ChatAction, Chat } from '../../interfaces/message';
import { AuthService } from '../../services/auth.service';
import { User } from '../../interfaces/user';
import { NavController } from '@ionic/angular';
import { Location } from '@angular/common';

@Component({
  selector: 'app-journal',
  templateUrl: './journal.page.html',
  styleUrls: ['./journal.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JournalPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('content', {static: false}) private content: any;
  @ViewChild('textarea', {static: false}) private textarea: any;

  MAX_MESSAGE_LENGTH = 1500;

  isActiveSlide = false;
  segmentMode = this.tasksService.myChallengesSelected ? this.tasksService.myChallengesSelected.mode : 'JOURNAL';
  selectedChallenge = this.tasksService.myChallengesSelected ? this.tasksService.myChallengesSelected.challenge : null;
  challenges: Task[] = null;
  completedChallenges: Task[] = null;
  _screenRes: Subscription;
  _challenges: Subscription;
  _completedChallenges: Subscription;
  _user: Subscription;
  isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
  inputDisabled = true;
  chatAction: ChatAction;
  messageText = '';
  showEmojiPicker = false;
  emojiCssStyle = { position: 'fixed', bottom: '60px', right: '20px', 'z-index': '2' };
  inputAutoGrow = true;
  ctrlEnter = false;
  isActiveInput = false;
  user: User = null;
  lastCursorPos = 0;

  constructor(public sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private tasksService: TasksService,
    public authService: AuthService,
    private navCtrl: NavController,
    private location: Location) { }

  ngOnInit() {
    this._challenges = this.tasksService.getTasks().subscribe((tasks) => {
      if (tasks) {
        const challenges = tasks.filter(task => task.challenge && task.challenge.is_challenge);
        challenges.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        this.challenges = challenges;

        if (!this.selectedChallenge && this.challenges && this.challenges.length > 0) {
          this.selectedChallenge = this.challenges[0];
        } else if (this.selectedChallenge && this.challenges) {
          const upToDate = this.challenges.find((challenge) => challenge.id === this.selectedChallenge.id);
          if (upToDate) {
            this.selectedChallenge = upToDate;
          }
        }
      }
      this.markForCheck();
    });

    this._completedChallenges = this.tasksService.getCompletedTasks().subscribe((tasks) => {
      if (tasks) {
        const challenges = tasks.filter(task => task.challenge && task.challenge.is_challenge);
        challenges.sort((a, b) => (a.name.toLowerCase() > b.name.toLowerCase()) ? 1 : -1);
        this.completedChallenges = challenges;
      }
      this.markForCheck();
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthChanged && this.isActiveSlide) {
        this.isActiveSlide = false;
        this.showEmojiPicker = false;
        this.markForCheck();
      }
      if (res.widthRangeChanged) {
        this.isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
        this.markForCheck();
      }
    });

    this._user = this.authService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#journal-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  markForCheck() {
    this.cd.detectChanges();
  }

  scrollToBottom(time = 300) {
    try {
      this.content.scrollToBottom(time);
    } catch (error) {
      console.error(error);
    }
  }

  toggleActiveSlide() {
    this.isActiveSlide = !this.isActiveSlide;
    this.markForCheck();
  }

  closeActiveSlide() {
    this.isActiveSlide = false;
    this.markForCheck();
  }

  openActiveSlideWithSwipe() {
    if (this.isLessThanMediumWindowWidth) {
      this.isActiveSlide = true;
      this.markForCheck();
    }
  }

  segmentChanged(event) {
    this.segmentMode = event.detail.value;
  }

  gotSelectedChallenge(challenge: Task) {
    this.selectedChallenge = JSON.parse(JSON.stringify(challenge));
    this.markForCheck();
  }

  inputChange(event) {
    const msg = event.detail.value;
    if (!this.ctrlEnter && msg.match('\n$') && msg.trim().length > 0 && !this.sharedService.isMobileApp()) {
      this.sendMessage();
      return;
    }
    this.ctrlEnter = false;
    this.messageText = event.detail.value;
    const numOfLines = this.messageText.split(/\r?\n/).length;
    if (numOfLines > 4 || this.messageText.length > 300) {
      this.inputAutoGrow = false;
    } else {
      this.inputAutoGrow = true;
    }
    const t = event.detail.value.trim();
    if (t.length > 0) {
      this.inputDisabled = false;
    }
    if (t.length > this.MAX_MESSAGE_LENGTH) {
      this.inputDisabled = true;
    }
  }

  ctrlEnterPressed() {
    this.ctrlEnter = true;
    this.messageText += '\n';
  }

  async sendMessage() {
    const message = this.messageText.trim();
    if (message.length > this.MAX_MESSAGE_LENGTH) {
      return;
    }
    if (this.selectedChallenge && message.length > 0) {
      this.chatAction = {
        action: 'add',
        message: this.messageText
      };
      this.messageText = '';
      this.showEmojiPicker = false;
      this.inputDisabled = true;
      this.inputAutoGrow = true;
      try {
        const el = await this.textarea.getInputElement();
        el.value = '';
        el.setSelectionRange(0, 0);
      } catch (error) {
        console.error(error);
      }
      this.markForCheck();
    }
  }

  chatUpdated(updated: {chat: Chat, isOnLoad: boolean}) {
    this.scrollToBottom(updated.isOnLoad ? 0 : void 0);
    this.markForCheck();
  }

  toggleEmoji() {
    this.showEmojiPicker = !this.showEmojiPicker;
    this.markForCheck();
  }

  async emojiSelected(event) {
    try {
      const emoji = event.emoji.native;
      const el = await this.textarea.getInputElement();
      let textCursorPos = this.lastCursorPos;
      if (el.selectionStart) {
        textCursorPos = el.selectionStart;
      }
      const preffix = this.messageText.slice(0, textCursorPos);
      const suffix = this.messageText.slice(textCursorPos);
      this.messageText =  preffix + emoji + suffix;
      if (preffix && emoji) {
        this.lastCursorPos  = preffix.length + emoji.length;
      }
      this.markForCheck();
    } catch (error) {
      console.error(error);
    }
  }

  async gotoProject(event) {
    const id = event ? event.projectId : null;
    if (id) {
      const projectId = await this.tasksService.tasksSchedulerService
      .getOrAddCurrectProjectIdForJoinedChallenge(id, this.selectedChallenge);
      if (!projectId) {
        return;
      }
      const db = this.tasksService.databaseService;
      db.subscribeToProjectById(projectId);
      if (this.sharedService._currentProject) {
        this.sharedService._currentProject.unsubscribe();
      }
      this.sharedService._currentProject =
      this.sharedService.currentProject$.subscribe((project) => {
        if (project) {
          this.gotoProjectById(projectId);
          this.sharedService._currentProject.unsubscribe();
        }
      });
    }
  }

  gotoProjectById(id: string) {
    const path = this.location.path();
    if (path && !path.startsWith('/project')
      && (!this.sharedService.navigationUrl
      || this.sharedService.navigationUrl
      && !this.sharedService.navigationUrl.startsWith('/project'))) {
      this.sharedService.setNavigatedFrom('journal');
      this.navCtrl.navigateForward(`/project/${id}`)
      .catch((error) => {
        console.error(error);
      });
    } else {
      this.sharedService.setNavigatedFrom(null);
      this.navCtrl.navigateRoot(`/project/${id}`)
      .catch((error) => {
        console.error(error);
      });
    }
  }

  ngOnDestroy() {
    this.tasksService.myChallengesSelected = null;
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._challenges) {
      this._challenges.unsubscribe();
    }
    if (this._completedChallenges) {
      this._completedChallenges.unsubscribe();
    }
    if (this._user) {
      this._user.unsubscribe();
    }
  }

}
