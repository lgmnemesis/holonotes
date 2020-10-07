import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VideoPlayer } from '../interfaces/videoPlayer';
import { DatabaseService } from './database.service';
import { SharedService } from './shared.service';
import { Timeline } from '../interfaces/timeline';
import { Project } from '../interfaces/project';
import { Video } from '../interfaces/video';

class VideoPlayerObj implements VideoPlayer {
  player = '';
  videoUrl = '';
  videoType = '';
  isPlaying = false;
  playerSpeed = 1;
  hasExternalcontrolButtons = false;
  loop = {
    isLoopOn: false,
    startTimeLoop: 0,
    endTimeLoop: 0
  };
  playerEvents: Observable<{}>;
}

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  players = new Map();
  private _activePlayerId = new BehaviorSubject('');
  private playerIdPrefix = 'video_';
  private playerMaxSpeed = 2;
  private playerMinSpeed = 0.25;
  private playerSpeedInterval = 0.25;
  isSmallModeView = false;
  lPlayerId: string;
  sPlayerId: string;
  isRangeButtonsOn = true;
  isHeightSplitMode = false;
  sourcePlayerViewName = 'Song View';
  lessonPlayerViewName = 'Lesson View';
  showViewName = false;
  lockShowViewNameTimeOut = false;
  PLAYER_SEEK_TIME = 5;
  FAST_SEEK_TIME = 10;

  activePlayerId: Observable<string> = this._activePlayerId.asObservable();
  videoPlayerButtonsKeyboardEventsSubject = new BehaviorSubject('');
  videoPlayerButtonsKeyboardEvents$ = this.videoPlayerButtonsKeyboardEventsSubject.asObservable();

  canUnmuteVolumeSubject = new BehaviorSubject(false);
  canUnmute$ = this.canUnmuteVolumeSubject.asObservable();

  controlsshownSubject = new BehaviorSubject(true);
  controlsshown$ = this.controlsshownSubject.asObservable();

  constructor(private databaseService: DatabaseService,
    private sharedService: SharedService) { }

  initVideoPlayer() {
    return new VideoPlayerObj();
  }

  registerPlayer(videoPlayer: VideoPlayer) {
    this.players.set(videoPlayer.playerId, videoPlayer);
  }

  unregisterPlayer(playerId: string) {
    this.players.delete(playerId);
  }

  generateUniqPlayerId(): string {
    return this.playerIdPrefix + Math.random().toString(36).substr(2, 16);
  }

  getPlayerById(playerId: string): VideoPlayer {
    return this.players.get(playerId);
  }

  isActivePlayer(playerId: string): boolean {
    return this._activePlayerId.value === playerId;
  }

  getActivePlayerId(): string {
    return this._activePlayerId.value;
  }

  setIsActivePlayerId(playerId: string) {
    this._activePlayerId.next(playerId);
  }

  switchPlayer(videoPlayer: VideoPlayer) {
    this.players.forEach((player: VideoPlayer, key) => {
      if (videoPlayer.playerId && videoPlayer.playerId === key) {
        // skip
      } else if (videoPlayer.isSwitchable && player.videoUrl !== 'initial') {
        this._activePlayerId.next(player.playerId);
        this.pauseAll();
        this.displayViewName();
        return;
      }
    });
  }

  pauseAll() {
    this.pausePlayers();
  }

  pauseAllOthers(playerId: string) {
    this.pausePlayers(playerId);
  }

  private pausePlayers(playerId?: string) {
    this.players.forEach((videoPlayer: VideoPlayer, key) => {
      if (playerId && playerId === key) {
        // skip
      } else {
        videoPlayer.player.pause();
      }
    });
  }

  playPause(videoPlayer: VideoPlayer) {
    if (videoPlayer.isPlaying) {
      this.pause(videoPlayer);
    } else {
      this.play(videoPlayer);
    }
  }

  play(videoPlayer: VideoPlayer) {
    videoPlayer.player.play();
  }

  pause(videoPlayer: VideoPlayer) {
    videoPlayer.player.pause();
  }

  backward(videoPlayer: VideoPlayer, seekTime?: number) {
    if (seekTime > 0) {
      if (!videoPlayer.isPlaying) {
        videoPlayer.playerCurrentTime -= this.FAST_SEEK_TIME;
      }
      videoPlayer.player.rewind(seekTime);
    } else {
      if (!videoPlayer.isPlaying) {
        videoPlayer.playerCurrentTime -= this.PLAYER_SEEK_TIME;
      }
      videoPlayer.player.rewind();
    }
  }

  forward(videoPlayer: VideoPlayer, seekTime?: number) {
    if (seekTime > 0) {
      if (!videoPlayer.isPlaying) {
        videoPlayer.playerCurrentTime += this.FAST_SEEK_TIME;
      }
      videoPlayer.player.forward(seekTime);
    } else {
      if (!videoPlayer.isPlaying) {
        videoPlayer.playerCurrentTime += this.PLAYER_SEEK_TIME;
      }
      videoPlayer.player.forward();
    }
  }

  lessSpeed(videoPlayer: VideoPlayer) {
    if (videoPlayer.player.embed.setPlaybackRate) {
      videoPlayer.player.embed.setPlaybackRate(this.decreasePlayerSpeed(videoPlayer));
      this.indicateSpeed(videoPlayer);
    }
  }

  moreSpeed(videoPlayer: VideoPlayer) {
    if (videoPlayer.player.embed.setPlaybackRate) {
      videoPlayer.player.embed.setPlaybackRate(this.increasePlayerSpeed(videoPlayer));
      this.indicateSpeed(videoPlayer);
    }
  }

  normalSpeed(videoPlayer: VideoPlayer) {
    if (videoPlayer.player.embed.setPlaybackRate) {
      videoPlayer.playerSpeed = 1;
      videoPlayer.player.embed.setPlaybackRate(videoPlayer.playerSpeed);
      this.indicateSpeed(videoPlayer);
    }
  }

  restart(videoPlayer: VideoPlayer) {
    videoPlayer.player.currentTime = 0;
  }

  gotoEnd(videoPlayer: VideoPlayer) {
    const duration = videoPlayer.player.duration;
    videoPlayer.player.currentTime = duration;
  }

  seekToByPercent(videoPlayer: VideoPlayer, percent: number) {
    const duration = videoPlayer.player.duration;
    let seekTime = percent * duration / 100;
    if (percent === 100) {
      seekTime -= 2;
    }
    seekTime = Math.round(seekTime);
    videoPlayer.player.currentTime = seekTime;
    videoPlayer.playerCurrentTime = seekTime;
  }

  toggleMute(videoPlayer: VideoPlayer) {
    const isMuted = videoPlayer.player.muted;
    if (!isMuted) {
      videoPlayer.playerVolume = videoPlayer.player.volume;
    }
    videoPlayer.player.muted = !isMuted;
  }

  increasePlayerVolume(videoPlayer: VideoPlayer) {
    this.savePlayerVolume(videoPlayer);
    videoPlayer.player.increaseVolume(0.1);
  }

  decreasePlayerVolume(videoPlayer: VideoPlayer) {
    this.savePlayerVolume(videoPlayer);
    videoPlayer.player.decreaseVolume(0.1);
  }

  savePlayerVolume(videoPlayer: VideoPlayer) {
    const isMuted = videoPlayer.player.muted;
    if (isMuted) {
      videoPlayer.player.muted = false;
      videoPlayer.player.volume = videoPlayer.playerVolume;
    }
  }

  decreasePlayerSpeed(videoPlayer: VideoPlayer): number {
    videoPlayer.playerSpeed = videoPlayer.player.embed.getPlaybackRate();
    if (videoPlayer.playerSpeed > this.playerMinSpeed) {
      videoPlayer.playerSpeed -= this.playerSpeedInterval;
    }
    return videoPlayer.playerSpeed;
  }

  increasePlayerSpeed(videoPlayer: VideoPlayer): number {
    videoPlayer.playerSpeed = videoPlayer.player.embed.getPlaybackRate();
    if (videoPlayer.playerSpeed < this.playerMaxSpeed) {
      videoPlayer.playerSpeed += this.playerSpeedInterval;
    }
    return videoPlayer.playerSpeed;
  }

  toggleFullScreen(videoPlayer: VideoPlayer) {
    videoPlayer.player.fullscreen.toggle();
  }

  indicateSpeed(videoPlayer: VideoPlayer) {
    const speed = videoPlayer.playerSpeed === 1 ? 'Normal' : videoPlayer.playerSpeed;
    this.sharedService.presentToast('Speed Set to ' + speed);
  }

  loadSelectedVideo(video: Video, onSplayer: boolean) {
    const player = onSplayer ? this.getPlayerById(this.sPlayerId) : this.getPlayerById(this.lPlayerId);
    this.loadSelectedTimelineByPlayer(player, video.video_id, 0, 0, 0, false, false);
  }

  loadSelectedTimeline(lPlayerId: string, sPlayerId: string, timeline: Timeline) {
    const lessonPlayer = this.getPlayerById(lPlayerId);
    const sourcePlayer = this.getPlayerById(sPlayerId);

    // tslint:disable-next-line:max-line-length
    this.loadSelectedTimelineByPlayer(lessonPlayer, timeline.lesson_id, timeline.lesson_currentTime,
      timeline.lesson_start_at, timeline.lesson_end_at, timeline.lesson_isLoopEnabled, !timeline.lesson_isActivePlayer);

    this.loadSelectedTimelineByPlayer(sourcePlayer, timeline.source_id, timeline.source_currentTime,
      timeline.source_start_at, timeline.source_end_at, timeline.source_isLoopEnabled, !timeline.source_isActivePlayer);

    this.setIsActivePlayerId(timeline.source_isActivePlayer ? sPlayerId : lPlayerId);
  }

  loadSelectedTimelineByPlayer(vplayer: VideoPlayer, id: string, currentTime: number,
    startAt: number, endAt: number, isLoopOn: boolean, dontPlay: boolean) {
    let currentSrc = '';
    if (vplayer.player && vplayer.player.source && vplayer.player.source.match(/.*v=.*/)) {
      currentSrc = vplayer.player.source.split('v=')[1].split('?')[0].split('&')[0];
    }

    const isLoadNewSource = id !== '' && currentSrc !== id;

    if (isLoadNewSource) {
      vplayer.player.source = {
        type: 'video',
        sources: [
          {
            src: id,
            provider: 'youtube',
          },
        ],
      };
    }

    vplayer.videoUrl = id;
    vplayer.videoType = 'youtube';
    vplayer.loop.startTimeLoop = startAt;
    vplayer.loop.endTimeLoop = endAt;
    vplayer.loop.isLoopOn = isLoopOn;

    if (isLoadNewSource) {
      vplayer.playerComponent.setVideoPlayerStyle();
      vplayer.player.once('ready', () => {
        this.setPlayerDefaults(vplayer);
        if (!dontPlay) {
          this.play(vplayer);
        }
        vplayer.player.currentTime = currentTime;
        if (this.sharedService.isIosApp()) {
          vplayer.player.muted = true;
        }
        this.canUnmuteVolumeSubject.next(true);
      });
    } else {
      if (!dontPlay) {
        this.play(vplayer);
      }
      vplayer.player.currentTime = currentTime;
    }
  }

  setPlayerDefaults(vplayer: VideoPlayer) {
    vplayer.player.muted = false;
    vplayer.player.currentTime = 0;
    vplayer.player.speed = 1;
    vplayer.player.embed.setPlaybackRate(1);
  }

  saveBookmarks() {
    const project = this.sharedService.currentProject;
    const data = {bookmarks: project.bookmarks};
    const toast = 'Booked Current Videos Settings';
    this.saveTimeline(data, toast);
  }

  saveTimeline(data, toast?: string) {
    this.sharedService.updateTimeLineWithMenuMap();
    this.updateProjectData(data);

    // Toast
    if (toast) {
      this.sharedService.presentToast(toast);
    }
  }

  updateProjectData(data) {
    const project = this.sharedService.currentProject;

    // Save to database
    this.databaseService.updateProjectFields(project, data).catch((error) => {
      console.error(error);
    });

    const keys = Object.keys(data);
    this.sharedService.projectUpdatedSubject.next(keys);
  }

  newTimeLine() {
    // Construct Timeline
    const lPlayer = this.getPlayerById(this.lPlayerId);
    const sPlayer = this.getPlayerById(this.sPlayerId);
    const name = this.getTimelineName();
    const description = this.getTimelineDescription(sPlayer, lPlayer);
    const isActivePlayer = this.getActivePlayerId() === lPlayer.playerId;
    const id = this.sharedService.generateId();
    const timeline: Timeline = {
      id: id,
      name: name,
      description: description,
      marker_name: '',
      tag_name: '',
      preview_tag: '',
      lesson_id: lPlayer.videoUrl,
      lesson_currentTime: lPlayer.loop.startTimeLoop,
      lesson_start_at: lPlayer.loop.startTimeLoop,
      lesson_end_at: lPlayer.loop.endTimeLoop,
      lesson_isLoopEnabled: lPlayer.loop.isLoopOn,
      lesson_isActivePlayer: isActivePlayer,
      source_id: sPlayer.videoUrl,
      source_currentTime: sPlayer.loop.startTimeLoop,
      source_start_at: sPlayer.loop.startTimeLoop,
      source_end_at: sPlayer.loop.endTimeLoop,
      source_isLoopEnabled: sPlayer.loop.isLoopOn,
      source_isActivePlayer: !isActivePlayer
    };
    return timeline;
  }

  getTimelineName(timeline?: Timeline): string {
    return '';
  }

  getTimeToDisplayBySeconds(time: number): string {
    if (!time) {
      time = 0;
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time - minutes * 60);
    return this.prettyTime(minutes, seconds);
  }

  prettyTime(minutes, seconds): string {
    return this.str_pad_left(minutes, '0', 2) + ':' + this.str_pad_left(seconds, '0', 2);
  }

  str_pad_left(string, pad, length) {
    return (new Array(length + 1).join(pad) + string).slice(-length);
  }

  getTimelineDescription(sPlayer, lPlayer): string {
    return '';
  }

  isTimelineExistsInProject(timelineArray: Timeline[] , timeline: Timeline): boolean {
    if (!timelineArray) {
      return false;
    }

    for (let i = 0; i < timelineArray.length; i++) {
      const element = timelineArray[i];
      if (element.lesson_id === timeline.lesson_id &&
        element.lesson_currentTime === timeline.lesson_currentTime &&
        element.lesson_start_at === timeline.lesson_start_at &&
        element.lesson_end_at === timeline.lesson_end_at &&
        element.source_id === timeline.source_id &&
        element.source_currentTime === timeline.source_currentTime &&
        element.source_start_at === timeline.source_start_at &&
        element.source_end_at === timeline.source_end_at) {
        return true;
      }
    }
    return false;
  }

  addVideo(video: Video) {
    const project: Project = this.sharedService.currentProject;
    // Check if video already exists
    if (this.isVideoExistsInProject(project.videos, video)) {
      const toast = 'Video already exists';
      this.sharedService.presentToast(toast);
    } else {
      if (!project.videos) {
        project.videos = [];
      }
      project.videos.push(video);
      this.saveVideos('Video added');
      this.sharedService.activeVideoId = video.id;
    }
  }

  isVideoExistsInProject(videosArray, video: Video): boolean {
    if (!videosArray) {
      return false;
    }

    for (let i = 0; i < videosArray.length; i++) {
      const element = videosArray[i];
      if (element.video_id === video.video_id) {
        return true;
      }
    }
    return false;
  }

  saveVideos(toast?: string) {
    const project = this.sharedService.currentProject;
    let data;
    data = { videos: project.videos };
    if (project.showInstructions) {
      data.showInstructions = false;
    }

    if (!project.cover_img || project.cover_img.trim() === '') {
      const img = project.videos[0].thumbnail_url;
      project.cover_img = img;
      data.cover_img = img;
    }

    // Save to database
    this.updateProjectData(data);

    // Toast
    if (toast) {
      this.sharedService.presentToast(toast);
    }
  }

  displayViewName() {
    this.showViewName = true;
    if (!this.lockShowViewNameTimeOut) {
      this.lockShowViewNameTimeOut = true;
      setTimeout(() => {
        this.showViewName = false;
        this.lockShowViewNameTimeOut = false;
      }, 3000);
    }
  }

}
