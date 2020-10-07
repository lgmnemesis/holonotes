import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit,
  Inject, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { NavController, ModalController, PopoverController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedService } from '../../services/shared.service';
import { VideoService } from '../../services/video.service';
import { DatabaseService } from '../../services/database.service';
import { Timeline } from '../../interfaces/timeline';
import { Video } from '../../interfaces/video';
import { VideoPlayerComponent } from '../../components/video-player/video-player.component';
import { EditBookmarkComponent } from '../../components/edit-bookmark/edit-bookmark.component';
import { ManageVideosComponent } from '../../components/manage-videos/manage-videos.component';
import { ManageProjectComponent } from '../../components/manage-project/manage-project.component';
import { ManageAllItemsComponent } from '../../components/manage-all-items/manage-all-items.component';
import { KeyboardShortcutsComponent } from '../../components/keyboard-shortcuts/keyboard-shortcuts.component';
import { Subscription } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { fade, translateYUpAll, translateXLeftLong } from '../../models/animations';
import { JourneyInputContainerPopoverComponent } from '../../components/journey-input-container-popover/journey-input-container-popover.component';
import { Challenge } from '../../interfaces/task';
import { ChallengeContainerModalComponent } from '../../components/project-challenge/challenge-container-modal.component';
import { TasksService } from '../../services/tasks.service';

@Component({
  selector: 'app-page-project',
  templateUrl: './project.page.html',
  styleUrls: ['./project.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYUpAll,
    translateXLeftLong
  ]
})
export class ProjectPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('lessonPlayer', { static: true }) lPlayer: VideoPlayerComponent;
  @ViewChild('sourcePlayer', { static: true }) sPlayer: VideoPlayerComponent;

  savedStatusMap = new Map();
  isVideoPlayerActive = true;
  leftsideViewNameToDisplay = 'timeline';
  isLeftsideContainer = false;
  isTimelineSmallModeView = false;
  isVideosSmallModeView = false;
  l_player_video_url = 'initial';
  l_player_video_type = 'youtube';
  s_player_video_url = 'initial';
  s_player_video_type = 'youtube';
  appTimelineEvent = {type: ''};
  showLeftSideMenu = true;
  isWidthSplitMode = false;
  canPresent = true;
  canPresentKeyboard = true;
  noVideosInViews = false;
  isControlsShown = false;
  isHideFooter = false;
  sharedChallengeIdParam: string = null;
  canJoinChallenge = false;
  joinedChallenge = false;
  isFreeHeightResForTimelineSlide = this.sharedService.isFreeHeightResForTimelineSlide();

  _screenRes: Subscription;
  _loadingSpinner: Subscription;
  _controlsshown: Subscription;
  _playerEvents: Subscription;
  _urlParams: Subscription;

  buttonsSlideOptions = {
    effect: 'slide',
    slidesPerView: 4,
    loop: false,
    autoplay: false
  };

  timelineSlideOptions = {
    effect: 'slide',
    slidesPerView: 'auto',
    spaceBetween: 5,
    breakpointsInverse: true,
    freeMode: true,
    grabCursor: false,
    centeredSlides: false
  };

  constructor(public sharedService: SharedService,
    public videoService: VideoService,
    private navCtrl: NavController,
    @Inject(DOCUMENT) private document,
    private databaseService: DatabaseService,
    private modalCtrl: ModalController,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private analyticsService: AnalyticsService,
    private popoverCtrl: PopoverController,
    private tasksService: TasksService) {
  }

  ngOnInit() {
    this._loadingSpinner = this.sharedService.loadingSpinner$
    .subscribe((isSpinning) => {
      if (isSpinning) {
        this.sharedService.unloadSpinner();
      }
    });

    // At this stage currentProject must exists. if not, then the ProjectGuard will redirect
    this.reset();

    // Choose the way which the videos are displayed when opening the project
    if (this.sharedService.currentProject.bookmarks && this.sharedService.currentProject.bookmarks.length >= 1) {
      this.l_player_video_url = this.sharedService.currentProject.bookmarks[0].lesson_id;
      this.s_player_video_url = this.sharedService.currentProject.bookmarks[0].source_id;
    } else if (this.sharedService.currentProject.videos && this.sharedService.currentProject.videos.length >= 1) {
      if (this.sharedService.currentProject.videos.length >= 2) {
        this.l_player_video_url = this.sharedService.currentProject.videos[1].video_id;
      }
      this.s_player_video_url = this.sharedService.currentProject.videos[0].video_id;
    }

    this.isWidthSplitMode = this.sharedService.isExtraLargeWindowWidth();

    if (this.l_player_video_url === 'initial') {
      this.isVideoPlayerActive = false;
      this.isWidthSplitMode = false;
      this.videoService.isHeightSplitMode = false;
    }
    if (this.l_player_video_url === 'initial' && this.s_player_video_url === 'initial') {
      this.noVideosInViews = true;
    } else if (this.s_player_video_url === 'initial') {
      this.isVideoPlayerActive = true;
      this.isWidthSplitMode = false;
      this.videoService.isHeightSplitMode = false;
    }

    this.sharedService.buildSubTags();

    // Check if need to add this project to library
    this.checkAndAddToLibrary();

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        if (!this.sharedService.isLessThanMediumWindowWidth()) {
          this.closeSmallModeView();
        } else {
          this.toggleSmallModeView();
          this.isWidthSplitMode = false;
          this.videoService.isHeightSplitMode = false;
          const sp = this.document.getElementById('source-player');
          sp.style = '';
        }
        this.sharedService.buildSubTags();
        this.markForCheck();
      }
      if (res.freeHeightRangeChanged) {
        this.isFreeHeightResForTimelineSlide = this.sharedService.isFreeHeightResForTimelineSlide();
        this.markForCheck();
      }
    });

    this._controlsshown = this.videoService.controlsshown$.subscribe((isShown) => {
      this.isControlsShown = isShown;
      this.markForCheck();
    });

    this._urlParams = this.activatedRoute.paramMap.subscribe(params => {
      const sharedChallengeId = params.get('scid');
      this.sharedChallengeIdParam = sharedChallengeId;
      if (sharedChallengeId
        && this.sharedService.sharedChallenge
        && this.sharedService.sharedChallenge.id === sharedChallengeId
        && !this.sharedService.alreadyJoinedSharedChallenge) {
        setTimeout(() => {
          this.canJoinChallenge = true;
          this.markForCheck();
        }, 1500);
      } else {
        this.canJoinChallenge = false;
      }
    });
  }

  ngAfterViewInit() {
    this.setProjectPlayers();
    this.isFreeHeightResForTimelineSlide = this.sharedService.isFreeHeightResForTimelineSlide();
  }

  trackByKey(i, pair) {
    return pair.key;
  }

  trackById(i, bookmark: Timeline) {
    return bookmark.id;
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  @HostListener('document:keydown', ['$event']) onKeyDown(e) {
    const activeId = this.videoService.getActivePlayerId();
    const activeVideo = this.videoService.getPlayerById(activeId);

    if (!this.sharedService.isHostListenerDisabled) {

      if (e.keyCode === 65) {
        // 'a' key to switch active player
        this.videoService.switchPlayer(activeVideo);
        this.document.activeElement.blur();
      } else if (e.keyCode === 32 || e.keyCode === 75) {
        // 'Space' key or 'k' key to toggle play
        if (!this.isActivePlayerControls()) {
          this.videoService.playPause(activeVideo);
        }
      } else if (!e.shiftKey && e.keyCode === 37) {
        // 'LEFT' key for backward (by 5 seconds)
        this.videoService.backward(activeVideo);
      } else if (!e.shiftKey && e.keyCode === 39) {
        // 'RIGHT' key for forward (by 5 seconds)
        this.videoService.forward(activeVideo);
      } else if (e.keyCode === 76) {
        // 'l' key for forward by 10 seconds
        this.videoService.forward(activeVideo, this.videoService.FAST_SEEK_TIME);
      } else if (e.keyCode === 74) {
        // 'j' key for backwards by 10 seconds
        this.videoService.backward(activeVideo, this.videoService.FAST_SEEK_TIME);
      } else if (e.shiftKey && (e.keyCode === 190 || e.keyCode === 39)) {
        // '>' key or 'SHIFT+RIGHT' for Increase rate speed
        this.videoService.moreSpeed(activeVideo);
      } else if (e.shiftKey && (e.keyCode === 188 || e.keyCode === 37)) {
        // '<' key or 'SHIFT+LEFT' for Decrease rate speed
        this.videoService.lessSpeed(activeVideo);
      } else if (e.keyCode === 78) {
        // 'n' key for normal rate speed
        this.videoService.normalSpeed(activeVideo);
      } else if (e.keyCode === 190) {
        // '.' key for forward in small step
        this.videoService.forward(activeVideo, 0.1);
      } else if (e.keyCode === 188) {
        // ',' key for backward in small step
        this.videoService.backward(activeVideo, 0.1);
      } else if (e.keyCode === 36) {
        // 'HOME' key for go to start of the video
        this.videoService.restart(activeVideo);
      } else if (e.keyCode === 35) {
        // 'END' key for go to end of the video
        this.videoService.gotoEnd(activeVideo);
      } else if (e.keyCode === 38) {
        // 'UP' key for increasing volume
        if (!this.isActivePlayerControls()) {
          this.videoService.increasePlayerVolume(activeVideo);
        }
      } else if (e.keyCode === 40) {
        // 'DOWN' key for decreasing volume
        if (!this.isActivePlayerControls()) {
          this.videoService.decreasePlayerVolume(activeVideo);
        }
      } else if (e.keyCode === 77) {
        // 'm' key for toggling mute
        if (!this.isActivePlayerControls()) {
          this.videoService.toggleMute(activeVideo);
        }
      } else if (e.keyCode === 70) {
        // 'f' key for toggling full screen
        if (!this.isActivePlayerControls()) {
          this.videoService.toggleFullScreen(activeVideo);
        }
      } else if (e.keyCode >= 48 && e.keyCode <= 57) {
        // '0 - 9' keys for Seek to specific point in the video
        let percent = (e.keyCode - 48) * 10;
        percent = percent === 0 ? 100 : percent;
        this.videoService.seekToByPercent(activeVideo, percent);
        this.videoService.gotoEnd(activeVideo);
      } else if (e.keyCode === 71) {
        // 'g' key for toggle video grid
        this.toggleSplitMode();
      } else if (e.keyCode === 85) {
        // 'u' key for setting end loop time
        this.videoService.videoPlayerButtonsKeyboardEventsSubject.next('isLoop');
      } else if (e.keyCode === 73) {
        // 'i' key for setting start loop time
        this.videoService.videoPlayerButtonsKeyboardEventsSubject.next('startLoop');
      } else if (e.keyCode === 79) {
        // 'o' key for setting end loop time
        this.videoService.videoPlayerButtonsKeyboardEventsSubject.next('endLoop');
      } else if (e.keyCode === 89) {
        // 'y' key for rewinding to start loop time
        this.videoService.videoPlayerButtonsKeyboardEventsSubject.next('gotoStartLoop');
      } else if (e.keyCode === 83) {
        // 's' key for saving bookmark
        this.videoService.videoPlayerButtonsKeyboardEventsSubject.next('save');
      } else if (e.shiftKey && e.keyCode === 191) {
        // '?' key for present keyboard shortcuts modal
        this.presentKeyboardShortcuts();
      }

    }
  }

  checkAndAddToLibrary() {
    try {
      const addToLibrary = localStorage.getItem('addToLibrary');
      if (addToLibrary) {
        localStorage.removeItem('addToLibrary');
        this.addToLibrary().catch((error) => console.error(error));
      }
    } catch (error) {
      console.error(error);
    }
  }

  async addToLibrary(): Promise<void> {
    const guest = this.databaseService.getMyUserId() ? '' : 'guest';
    this.sharedService.presentToast(`Adding ${this.sharedService.currentProject.name} to your ${guest} library...`, 5000);
    const isPublic = false;
    const data = {is_public: isPublic}; // update project fields to add it to library
    this.sharedService.currentProject.is_public = isPublic;
    return this.databaseService.updateProjectFields(this.sharedService.currentProject, data);
  }

  isActivePlayerControls() {
     // if isActive, then the event is done by the player(plyr) itself
    const activeElement = <HTMLElement>this.document.activeElement;
    const isActive = activeElement.classList.contains('plyr__control');
    return isActive;
  }

  switchButtonWasPressed(event) {
    if (this.savedStatusMap.size === 0) {
      this.savedStatusMap.set(event.activeId, true);
    } else {
      if (!this.savedStatusMap.get(event.activeId)) {
        this.savedStatusMap.forEach((isActive: boolean, key) => {
          this.savedStatusMap.set(key, false);
        });
        this.savedStatusMap.set(event.activeId, true);
        this.isVideoPlayerActive = !this.isVideoPlayerActive;
      }
    }
  }

  setProjectPlayers() {
    if (this.lPlayer && this.sPlayer) {
      this.videoService.lPlayerId = this.lPlayer.getId();
      this.videoService.sPlayerId = this.sPlayer.getId();
    }
  }

  closeSmallModeView() {
    this.videoService.isSmallModeView = false;
    this.isVideosSmallModeView = false;
    this.isTimelineSmallModeView = false;
    this.toggleSmallModeView();
  }

  smallModeToggleFooter() {
    this.isHideFooter = !this.isHideFooter;
  }

  toggleSmallModeView() {
    const player = this.videoService.getPlayerById(this.videoService.getActivePlayerId());
    if (player) {
      player.playerComponent.setVideoPlayerStyle();
    }
  }

  setTimelineSmallModeView() {
    this.videoService.isSmallModeView = true;
    this.isTimelineSmallModeView = true;
    this.isVideosSmallModeView = false;
    this.toggleSmallModeView();
  }

  setVideosSmallModeView() {
    this.videoService.isSmallModeView = true;
    this.isVideosSmallModeView = true;
    this.isTimelineSmallModeView = false;
    this.toggleSmallModeView();
  }

  smallModeOpen() {
    const itemsName = this.isTimelineSmallModeView ? 'bookmarks' : 'videos';
    this.presentManageAllItems(itemsName);
  }

  smallModeAdd() {
    if (this.isVideosSmallModeView) {
      this.addVideo();
    }
  }

  smallModeSort() {
    if (this.isTimelineSmallModeView) {
      this.appTimelineEvent = {type: 'sort'};
    }
  }

  toggleLeftMenu(event, menu: string) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      if (menu === 'menu') {
        this.showLeftSideMenu = !this.showLeftSideMenu;
      } else {
        this.leftsideViewNameToDisplay = menu;
        this.showLeftSideMenu = true;
      }
    }
    this.markForCheck();
  }

  eventFromMenu(event) {
    if (event.type === 'deleteBookmark') {
      this.deleteBookmark(event);
    } else if (event.type === 'editBookmark') {
      this.editBookmark(event);
    } else if (event.type === 'overwriteBookmark') {
      this.overwriteBookmark(event);
    } else if (event.type === 'addVideo') {
      this.addVideo();
    } else if (event.type === 'playOnVideo') {
      const onSplayer = event.isOnSplayer;
      this.videoSelected(event, onSplayer);
    } else if (event.type === 'editVideo') {
      this.editVideo(event);
    } else if (event.type === 'deleteVideo') {
      this.deleteVideo(event);
    } else if (event.type === 'videoSelected') {
      const onSplayer = this.sPlayer.isActive;
      this.videoSelected(event, onSplayer);
    } else if (event.type === 'manage-all-bookmarks') {
      this.presentManageAllItems('bookmarks');
    } else if (event.type === 'manage-all-videos') {
      this.presentManageAllItems('videos');
    } else {
      this.loadSelectedItem(event);
    }
  }

  videoSelected(event, onSplayer: boolean) {
    const id = event.id;
    const videos = this.sharedService.currentProject.videos;
    const video = videos.find(o => o.id === id);
    if (video) {
      this.sharedService.activeVideoId = id;
      this.videoService.loadSelectedVideo(video, onSplayer);
      if (onSplayer) {
        this.s_player_video_url = video.video_id;
      } else {
        this.l_player_video_url = video.video_id;
      }
      this.markForCheck();
    }
  }

  loadSelectedItem(event) {
    this.loadSelectedBookmark(event.bookmark);

  }

  loadSelectedBookmark(bookmark: Timeline) {
    if (bookmark) {
      this.sharedService.activeBookmarkId = bookmark.id;
      this.videoService.loadSelectedTimeline(this.lPlayer.getId(), this.sPlayer.getId(), bookmark);
      this.sharedService.projectUpdatedSubject.next(['bookmarks']);
    }
  }

  filterObjToDelete(arrayOfObjects: Array<any>, id: number) {
    const index = arrayOfObjects.findIndex((obj) => obj.id === id);
    if (index > -1) { arrayOfObjects.splice(index, 1); }
    return arrayOfObjects;
  }

  deleteBookmark(event) {
    const project = this.sharedService.currentProject;
    const bookmarks = this.filterObjToDelete(project.bookmarks, event.id);
    const data = {bookmarks: bookmarks};
    this.videoService.saveTimeline(data);
  }

  deleteVideo(event) {
    const videos = this.filterObjToDelete(this.sharedService.currentProject.videos, event.id);
    const data = {videos: videos};
    this.videoService.updateProjectData(data);
  }

  editBookmark(event) {
    // Find bookmark by id
    const id = event.id;
    const bookmarks = this.sharedService.currentProject.bookmarks;
    const bookmark = bookmarks.find((bm) => bm.id === id);
    if (bookmark) {
      this.presentEditBookmarkModal(bookmark);
    }
  }

  overwriteBookmark(event) {
    // Find bookmark by id
    const id = event.id;
    const bookmarks = this.sharedService.currentProject.bookmarks;
    const currentBookmark = bookmarks.find((bm) => bm.id === id);
    if (currentBookmark) {
      const filterd = this.filterObjToDelete(bookmarks, currentBookmark.id);
      const bookmark = this.videoService.newTimeLine();
      bookmark.name = currentBookmark.name || '';
      bookmark.description = currentBookmark.description || '';
      bookmark.tag_name = currentBookmark.tag_name || '';
      bookmark.marker_name = currentBookmark.marker_name || '';

      filterd.push(bookmark);
      this.videoService.saveBookmarks();
    }
  }

  addVideo() {
    this.presentManageVideoModal();
  }

  editVideo(event) {
    // Find video by id
    const id = event.id;
    const videos = this.sharedService.currentProject.videos;
    const video = videos.find((bm) => bm.id === id);
    if (video) {
      this.presentManageVideoModal(video);
    }
  }

  timerInputButtonClicked(event: Event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.presentTimerInputPopover(event);
    }
  }

  async presentTimerInputPopover(ev: Event) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const css = this.sharedService.isLessThanExtraSmallWindowWidth() ? 'journey-time-input-xsm-popover' : 'journey-time-input-popover';
    const allcss = this.sharedService.isMobileApp() ? `${css} journey-time-input-mobile-popover` : `${css}`;
    const showJourneyLink = this.databaseService.getMyUserId() ? true : false;
    const modal = await this.popoverCtrl.create({
      component: JourneyInputContainerPopoverComponent,
      componentProps: {showToast: true, showJourneyLink},
      cssClass: allcss,
      event: ev,
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.gotoJourney) {
          this.gotoJourney();
        }
        this.sharedService.isHostListenerDisabled = false;
        this.canPresent = true;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
        this.canPresent = true;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  async presentManageAllItems(itemsName: string) {
    const modal = await this.modalCtrl.create({
      component: ManageAllItemsComponent,
      componentProps: { itemsName: itemsName },
      cssClass: 'manage-all-items-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.update) {
          let data;
          if (res.data.bookmarks) {
            this.sharedService.currentProject.bookmarks = res.data.bookmarks;
            data = {bookmarks: res.data.bookmarks};
            this.sharedService.updateTimeLineWithMenuMap();
          } else if (res.data.videos) {
            this.sharedService.currentProject.videos = res.data.videos;
            data = {videos: res.data.videos};
          }
          if (data) {
            this.videoService.updateProjectData(data);
          }
        }
        this.sharedService.isHostListenerDisabled = false;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  async presentManageVideoModal(video?: Video) {
    const modal = await this.modalCtrl.create({
      component: ManageVideosComponent,
      componentProps: {video: video},
      cssClass: 'manage-video-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.shouldUpdate) {
          if (!video) {
            this.videoService.addVideo(res.data.video);
          } else {
            const edited: Video = res.data.video;
            video.thumbnail_url = edited.thumbnail_url;
            video.title = edited.title;
            video.video_id = edited.video_id;
            video.id = edited.id;
            this.videoService.saveVideos();
          }
        }
        this.sharedService.isHostListenerDisabled = false;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  async presentEditBookmarkModal(bookmark: Timeline) {
    const modal = await this.modalCtrl.create({
      component: EditBookmarkComponent,
      componentProps: {bookmark: bookmark},
      cssClass: 'edit-bookmark-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.shouldUpdate) {
          if (res.data.setCurrentSettings) {
            const id = bookmark.id;
            bookmark = this.videoService.newTimeLine();
            bookmark.id = id;
          }
          bookmark.name = res.data.name || '';
          bookmark.description = res.data.description || '';
          bookmark.tag_name = res.data.tag_name || '';
          bookmark.marker_name = res.data.marker_name || '';
          if (res && res.data && res.data.setCurrentSettings) {
            const bookmarks = this.filterObjToDelete(this.sharedService.currentProject.bookmarks, bookmark.id);
            bookmarks.push(bookmark);
          }
          this.videoService.saveBookmarks();
        }
        this.sharedService.isHostListenerDisabled = false;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  async presentKeyboardShortcuts() {
    if (!this.canPresentKeyboard) {
      return;
    }
    this.canPresentKeyboard = false;

    const css = 'keyboard-shortcuts-modal' + this.sharedService.getCssSuffix();
    const modal = await this.modalCtrl.create({
      component: KeyboardShortcutsComponent,
      cssClass: css,
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        this.sharedService.isHostListenerDisabled = false;
        this.canPresentKeyboard = true;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
        this.canPresentKeyboard = true;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  goBackButton(event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.goBack();
    }
  }

  goBack() {
    if (this.sharedService.navigationUrl) {
      this.navCtrl.navigateBack(this.sharedService.navigationUrl).catch(error => console.error(error));
    } else {
      this.navCtrl.navigateBack('#').catch(error => console.error(error));
    }
    this.sharedService.setNavigatedFrom(null);
  }

  gotoJourney() {
    this.navCtrl.navigateForward('journey').catch(error => console.error(error));
  }

  editProject(event: Event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.presentEditProjectModal();
    }
  }

  async presentEditProjectModal(showInstructions?: boolean) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const css = 'manage-project-modal';
    const modal = await this.modalCtrl.create({
      component: ManageProjectComponent,
      componentProps: { project: this.sharedService.currentProject,
        projectPageComponent: this, showInstructions: showInstructions },
      cssClass: css,
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.shouldUpdate) {
          this.sharedService.currentProject.name = res.data.name;
          let data;
          data = {name: this.sharedService.currentProject.name};
          const artist = res.data.artist || '';
          data.artist = artist;
          this.sharedService.currentProject.artist = artist;
          const coverImg = res.data.cover_img;
          if (coverImg) {
            data.cover_img = coverImg;
            this.sharedService.currentProject.cover_img = coverImg;
          }
          const isPublic = res.data.is_public;
          data.is_public = isPublic;
          this.sharedService.currentProject.is_public = isPublic;
          const collections = res.data.collections;
          if (collections) {
            data.collections = collections;
            this.sharedService.currentProject.collections = collections;
          }
          this.databaseService.updateProjectFields(this.sharedService.currentProject, data).catch((error) => {
            console.error(error);
          });
        } else if (res && res.data && res.data.shouldDelete) {
          this.databaseService.deleteProject(this.sharedService.currentProject)
          .then(() => {
            this.analyticsService.sendRemoveProjectEvent();
          })
          .catch((error) => {
            console.error(error);
          });
          this.goBack();
        } else if (res && res.data && res.data.shouldCopy) {
          this.databaseService.copyProject(this.sharedService.currentProject)
          .then(() => {
            this.sharedService.presentToast(`Project ${this.sharedService.currentProject.name} was copied.`);
          })
          .catch((error) => {
            console.error(error);
          });
        } else if (res && res.data && res.data.signIn) {
          // Save project and project id in local storage for referance when logged in
          try {
            localStorage.setItem('projectId', this.sharedService.currentProject.id);
          } catch (error) {
            console.error(error);
          }
          this.router.navigateByUrl('/profile').then(() => {
            this.sharedService.isHostListenerDisabled = true;
          })
          .catch((error) => {
            console.error(error);
          });
        }
        this.sharedService.isHostListenerDisabled = false;
        this.canPresent = true;
      })
      .catch((error) => {
        console.error(error);
        this.sharedService.isHostListenerDisabled = false;
        this.canPresent = true;
      });

    return await modal.present().then(() => {
      this.sharedService.isHostListenerDisabled = true;
    });
  }

  toggleSplitMode(event?) {
    if (!event || this.sharedService.eventShouldBeTrigger(event)) {
      if (this.videoService.isHeightSplitMode) {
        this.videoService.isHeightSplitMode = false;
        this.isWidthSplitMode = false;
        const sp = this.document.getElementById('source-player');
        sp.style.top = '0';
        this.lPlayer.setVideoPlayerStyle();
      } else if (!this.isWidthSplitMode) {
        this.isWidthSplitMode = true;
      } else if (!this.videoService.isHeightSplitMode) {
        this.isWidthSplitMode = false;
        this.videoService.isHeightSplitMode = true;
        this.lPlayer.setVideoPlayerStyle();
        const top = this.lPlayer.getVideoPlayerStyleHight();
        const sp = this.document.getElementById('source-player');
        sp.style.top = top;
      }

      this.videoService.displayViewName();
    }
  }

  async joinChallenge() {
    const sharedChallenge = this.sharedService.sharedChallenge;
    if (!sharedChallenge) {
      return;
    }
    const challenge: Challenge = JSON.parse(JSON.stringify(sharedChallenge.challenge));
    challenge.is_public = false;
    challenge.joined = true;
    this.presentChallengeModal(challenge);
    this.analyticsService.sendJoinChallengeFromProjectEvent();
  }

  async presentChallengeModal(challenge: Challenge) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const modal = await this.modalCtrl.create({
      component: ChallengeContainerModalComponent,
      componentProps: {challenge: challenge, animate: false, canSetPublic: false},
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res) {
          if (res && res.data && res.data.isAdded) {
            this.addChallenge(res.data.challenge, false).catch(error => console.error(error));
            this.canJoinChallenge = false;
            this.sharedService.sharedChallenge = null;
            this.joinedChallenge = true;
            this.markForCheck();
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

  gotIt() {
    this.joinedChallenge = false;
    this.markForCheck();
  }

  addChallenge(challenge, showToast = true): Promise<void> {
    if (showToast) {
      this.sharedService.presentToast('Challenge was added to your activities', 3000);
    }
    return this.tasksService.addChallenge(challenge);
  }

  reset() {
    this.sharedService.isHostListenerDisabled = false;
    this.sharedService.activeBookmarkId = -1;
    this.sharedService.activeVideoId = -1;
    this.sharedService.subTags = [];
    this.sharedService.timelinePointerBookmarkId = null;
    this.videoService.isSmallModeView = false;
    this.videoService.isHeightSplitMode = false;
    this.videoService.lPlayerId = null;
    this.videoService.sPlayerId = null;
    this.videoService.setIsActivePlayerId('');
  }

  ngOnDestroy() {
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._loadingSpinner) {
      this._loadingSpinner.unsubscribe();
    }
    if (this._controlsshown) {
      this._controlsshown.unsubscribe();
    }
    if (this._playerEvents) {
      this._playerEvents.unsubscribe();
    }
    if (this._urlParams) {
      this._urlParams.unsubscribe();
    }
  }
}
