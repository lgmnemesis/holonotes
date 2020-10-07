import { Component, OnInit, AfterViewInit, OnDestroy, Input, Output, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subscription, Subject, BehaviorSubject } from 'rxjs';
import { takeUntil, throttleTime, debounceTime } from 'rxjs/operators';
import { VideoPlayer } from '../../interfaces/videoPlayer';
import { VideoService } from '../../services/video.service';
import { SharedService } from '../../services/shared.service';
import { Project } from '../../interfaces/project';
import { Timeline } from '../../interfaces/timeline';
import { fade, leftAndBlink, translateYDown } from '../../models/animations';

@Component({
  selector: 'app-video-player-buttons',
  templateUrl: './video-player-buttons.component.html',
  styleUrls: ['./video-player-buttons.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    leftAndBlink,
    translateYDown
  ]
})
export class VideoPlayerButtonsComponent implements OnInit, AfterViewInit, OnDestroy {

  tooltipTextForSave = 'Save as bookmark';
  tooltipTextForRepeat = 'Rewind to loop start time';
  tooltipTextForLoopOnOff = 'Enable/Disable loop';
  tooltipTextForLoopStartTime = 'Loop start time. You can set start time by clicking';
  tooltipTextForLoopEndTime = 'Loop end time. You can set end time by clicking';

  @Input() useActivePlayer = false;
  @Input() showSwitchButton = true;
  @Input() subTags = [];
  @Output() switch = new EventEmitter();
  @Output() markerEvent = new EventEmitter();
  @Output() tagEvent = new EventEmitter();

  videoPlayer: VideoPlayer;
  private activePlayerIdObserver: Subscription;
  private playerEventObserver: Subscription;
  playerEventSubscribtion = new Map();
  durationTime = 0;
  currentTimeToDisplay = '00:00';
  loopRangeLowerToDisplay = '00:00';
  loopRangeUpperToDisplay = '00:00';
  durationTimeToDisplay = '00:00';
  loopRange: { lower: number, upper: number };
  isFlagAnimation = false;
  playerSeekValueCanUpdate = false;
  toggleRangeButtonsIconName = 'caret-down';
  updateLoopRangeInternaly = false;
  buttonsUpdatedSubject = new BehaviorSubject('');
  buttonsUpdated$ = this.buttonsUpdatedSubject.asObservable();
  destroy$: Subject<boolean> = new Subject<boolean>();
  isBothViews = true;
  playerSeekValueSubject = new BehaviorSubject(false);
  playerSeekValue$ = this.playerSeekValueSubject.asObservable();
  pointerTimelineSubject: BehaviorSubject<{id: string, time: number}> = new BehaviorSubject(null);
  pointerTimeline$ = this.pointerTimelineSubject.asObservable();

  constructor(public videoService: VideoService,
    public platform: Platform,
    public sharedService: SharedService,
    private cd: ChangeDetectorRef) {
  }

  ngOnInit() {
    this.videoService.isRangeButtonsOn = true;

    this.buttonsUpdated$
      .pipe(
        throttleTime(200),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.cd.markForCheck();
      });

      this.playerSeekValue$
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        this.playerSeekValueCanUpdate = false;
        this.cd.markForCheck();
      });

      this.pointerTimeline$
      .pipe(
        throttleTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe((res) => {
        if (res && res.id && res.time) {
          const id = res.id;
          const time = res.time;
          this.setPointerTimeline(id, time);
        }
      });
  }

  ngAfterViewInit() {
    try {
      setTimeout(() => {
        if (this.useActivePlayer) {
          this.activePlayerIdObserver = this.videoService.activePlayerId.subscribe(videoPlayerId => {
            this.videoPlayer = this.videoService.getPlayerById(videoPlayerId);
            if (this.videoPlayer) {
              this.updatePlayerButtons();
              if (!this.playerEventSubscribtion.get(videoPlayerId) && this.videoPlayer.hasExternalcontrolButtons) {
                this. playerEventObserver = this.videoPlayer.playerEvents.subscribe(event => {
                  this.playerEventSubscribtion.set(videoPlayerId, true);
                  if (event.isReady) {
                    this.updatePlayerButtons();
                  } else if (event.isPlay) {
                    this.cd.markForCheck();
                  } else if (event.isPause) {
                    this.cd.markForCheck();
                  } else if (event.isTimeUpdate && !this.playerSeekValueCanUpdate) {
                    this.videoPlayer.playerCurrentTime = this.videoPlayer.player.currentTime;
                    this.currentTimeToDisplay = this.getTimeToDisplayBySeconds(Math.floor(this.videoPlayer.playerCurrentTime));
                    this.trackLoop();
                    this.buttonsUpdatedSubject.next('tu');
                    this.pointerTimelineSubject.next({id: this.videoPlayer.videoUrl, time: this.videoPlayer.playerCurrentTime});
                  } else if (event.seeking && !this.playerSeekValueCanUpdate) {
                    // this.videoPlayer.loop.currentTime = this.videoPlayer.player.currentTime;
                    // const currentTime = this.videoPlayer.player.currentTime;
                    // this.playerSeekValue = currentTime;
                    // this.currentTimeToDisplay = this.getTimeToDisplayBySeconds(Math.floor(currentTime));
                  }
                });
              }
            }
          });
        }

        // Register to project relevant keyboard events (only those that are triggered from this components only)
        this.videoService.videoPlayerButtonsKeyboardEvents$
        .pipe(takeUntil(this.destroy$))
        .subscribe((event) => {
          if (event === 'startLoop') {
            this.setStartTimeLoop();
          } else if (event === 'endLoop') {
            this.setEndTimeLoop();
          } else if (event === 'isLoop') {
            this.enableDisableLoop();
          } else if (event === 'gotoStartLoop') {
            this.rewindToStartLoop();
          } else if (event === 'save') {
            this.saveMarker();
          }
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  setPointerTimeline(id: string, time: number) {
    this.sharedService.setPointerTimeline(id, time);
  }

  isVideoIsPlaying(): boolean {
    return this.videoPlayer !== undefined && this.videoPlayer.isPlaying;
  }

  playPause(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.playPause(this.videoPlayer);
      }
    }
  }

  backward(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.backward(this.videoPlayer);
      }
    }
  }

  forward(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.forward(this.videoPlayer);
      }
    }
  }

  lessSpeed(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.lessSpeed(this.videoPlayer);
      }
    }
  }

  moreSpeed(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.moreSpeed(this.videoPlayer);
      }
    }
  }

  switchPlayer(event) {
    if (this.videoPlayer) {
      if (this.eventShouldBeTrigger(event)) {
        this.videoService.switchPlayer(this.videoPlayer);
      }
    }
  }

  toggleRangeButtons(event) {
    if (this.eventShouldBeTrigger(event)) {
      this.videoService.isRangeButtonsOn = !this.videoService.isRangeButtonsOn;
      this.setRangeButtonsIconName();
      const player = this.videoService.getPlayerById(this.videoService.getActivePlayerId());
      player.playerComponent.setVideoPlayerStyle();
    }
  }

  setRangeButtonsIconName() {
    this.toggleRangeButtonsIconName = this.videoService.isRangeButtonsOn ? 'caret-down' : 'caret-up';
  }

  saveMarker(event?) {
    if (this.videoPlayer) {
      if (!event || this.eventShouldBeTrigger(event)) {
        // Construct flag
        const marker = this.videoService.newTimeLine();
        const project: Project = this.sharedService.currentProject;

        // Check if flag already exists
        if (this.videoService.isTimelineExistsInProject(project.bookmarks, marker)) {
          const toast = 'Bookmark Exists';
          this.sharedService.presentToast(toast);
        } else {
          if (!project.bookmarks) {
            project.bookmarks = [];
          }
          this.sharedService.activeBookmarkId = marker.id;
          project.bookmarks.push(marker);
          this.addSubTag(marker);
          this.videoService.saveBookmarks();
        }
      }
    }
  }

  addSubTag(marker: Timeline) {
    if (!marker.name) {
      const tags = this.sharedService.subTags;
      if (tags && tags.length >= this.sharedService.getMaxNumOfSubTags()) {
        tags.shift();
      }
      tags.push(marker);
    }
  }

  loadSelectedMarker(event, id: number) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.markerEvent.next({ type: 'marker', id: id });
    }
  }

  rewindToStartLoop(event?) {
    if (this.videoPlayer) {
      if (!event || this.eventShouldBeTrigger(event)) {
        if ( this.videoPlayer.loop.startTimeLoop >= 0) {
          this.playerSeekValueCanUpdate = true;
          this.videoPlayer.player.currentTime = this.videoPlayer.loop.startTimeLoop;
          this.currentTimeToDisplay = this.getTimeToDisplayBySeconds(Math.floor(this.videoPlayer.loop.startTimeLoop));
          this.videoPlayer.playerCurrentTime = this.videoPlayer.loop.startTimeLoop;
          this.playerSeekValueCanUpdate = false;
          const toast = 'Player time set to ' + this.getTimeToDisplayBySeconds(this.videoPlayer.loop.startTimeLoop);
          this.sharedService.presentToast(toast);
        }
      }
    }
  }

  enableDisableLoop(event?) {
    if (this.videoPlayer) {
      if (!event || this.eventShouldBeTrigger(event)) {
        this.videoPlayer.loop.isLoopOn = !this.videoPlayer.loop.isLoopOn;
        const toast = 'Loop ' + (this.videoPlayer.loop.isLoopOn ? 'Enabled' : 'Disabled');
        this.sharedService.presentToast(toast);
      }
    }
  }

  setStartTimeLoopButton(event) {
    if (this.eventShouldBeTrigger(event)) {
      this.setStartTimeLoop();
    }
  }

  setEndTimeLoopButton(event) {
    if (this.eventShouldBeTrigger(event)) {
      this.setEndTimeLoop();
    }
  }

  eventShouldBeTrigger(event: any) {
    return this.sharedService.eventShouldBeTrigger(event);
  }

  trackLoop() {
    if (this.videoPlayer.loop.isLoopOn) {
      if (this.videoPlayer.player.currentTime >= this.videoPlayer.loop.endTimeLoop) {
        this.videoPlayer.player.currentTime = this.videoPlayer.loop.startTimeLoop;
      }
    }
  }

  setStartTimeLoop() {
    if (this.videoPlayer) {
      this.videoPlayer.loop.startTimeLoop = this.videoPlayer.player.currentTime;
      if (this.videoPlayer.loop.startTimeLoop > this.videoPlayer.loop.endTimeLoop) {
        this.videoPlayer.loop.endTimeLoop = this.videoPlayer.loop.startTimeLoop + this.videoService.PLAYER_SEEK_TIME;
      }
      this.updateLoopRangeInternaly = true;
      this.updateLoopRange();
      const toast = 'Loop Start Time Set to ' + this.loopRangeLowerToDisplay;
      this.sharedService.presentToast(toast);
    }
  }

  setEndTimeLoop() {
    if (this.videoPlayer) {
      this.videoPlayer.loop.endTimeLoop = this.videoPlayer.player.currentTime;
      if (this.videoPlayer.loop.endTimeLoop < this.videoPlayer.loop.startTimeLoop) {
        this.videoPlayer.loop.startTimeLoop = this.videoPlayer.loop.endTimeLoop;
      }
      this.updateLoopRangeInternaly = true;
      this.updateLoopRange();
      const toast = 'Loop End Time Set to ' + this.loopRangeUpperToDisplay;
      this.sharedService.presentToast(toast);
    }
  }

  updateLoopRange(dontUpdateUi?: boolean) {
    if (this.videoPlayer) {
      const lowerRoundedDown = Math.floor(this.videoPlayer.loop.startTimeLoop);
      const upperRoundedDown = Math.floor(this.videoPlayer.loop.endTimeLoop);
      this.loopRangeLowerToDisplay = this.getTimeToDisplayBySeconds(lowerRoundedDown);
      this.loopRangeUpperToDisplay = this.getTimeToDisplayBySeconds(upperRoundedDown);
      if (!dontUpdateUi) {
        this.loopRange = { lower: lowerRoundedDown, upper: upperRoundedDown };
      }
    }
  }

  loopRangeOnChange(ev: any) {
    if (this.updateLoopRangeInternaly) {
      this.updateLoopRangeInternaly = false;
      return;
    }
    if (this.videoPlayer) {
      const lowerRoundedDown = Math.floor(this.videoPlayer.loop.startTimeLoop);
      const upperRoundedDown = Math.floor(this.videoPlayer.loop.endTimeLoop);
      const lower = ev.currentTarget.value.lower;
      const upper = ev.currentTarget.value.upper;
      if (lowerRoundedDown !== lower) {
        this.videoPlayer.loop.startTimeLoop = lower;
      }
      if (upperRoundedDown !== upper) {
        this.videoPlayer.loop.endTimeLoop = upper;
      }
      this.updateLoopRange(true);
    }
  }

  playerSeekValueOnChangeCanUpdate(canUpdate: boolean) {
    this.playerSeekValueCanUpdate = canUpdate;
  }

  playerSeekValueOnChange(ev: any) {
    if (this.videoPlayer && this.playerSeekValueCanUpdate) {
      this.videoPlayer.player.currentTime = ev.currentTarget.value;
      this.currentTimeToDisplay = this.getTimeToDisplayBySeconds(Math.floor(ev.currentTarget.value));
      this.playerSeekValueSubject.next(true);
    }
  }

  getTimeToDisplayBySeconds(time: number): string {
    return this.videoService.getTimeToDisplayBySeconds(time);
  }

  updatePlayerButtons() {
    if (this.videoPlayer) {
      this.switch.next({ activeId: this.videoPlayer.playerId });
      this.durationTime = this.videoPlayer.player.duration;
      this.durationTimeToDisplay = this.getTimeToDisplayBySeconds(this.durationTime);
      this.videoPlayer.playerCurrentTime = this.videoPlayer.player.currentTime;
      this.currentTimeToDisplay = this.getTimeToDisplayBySeconds(Math.floor(this.videoPlayer.playerCurrentTime));
      this.updateLoopRange();
      this.buttonsUpdatedSubject.next('upb');
    }
  }

  isIos(): boolean {
    return this.platform.is('ios');
  }

  loadSelectedTag(event, tag: Timeline) {
    if (this.eventShouldBeTrigger(event)) {
      this.tagEvent.next({ type: 'tags', bookmark: tag });
    }
  }

  trackById(i, tag: Timeline) {
    return tag.id;
  }

  ngOnDestroy() {
    if (this.playerEventObserver) {
      this.playerEventObserver.unsubscribe();
    }
    if (this.activePlayerIdObserver) {
      this.activePlayerIdObserver.unsubscribe();
    }

    this.destroy$.next(true);
    this.destroy$.complete();
  }

}
