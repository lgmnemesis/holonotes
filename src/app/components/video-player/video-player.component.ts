import { Component, OnInit, OnDestroy, Input, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { DomController } from '@ionic/angular';
import { VideoService } from '../../services/video.service';
import { SharedService } from '../../services/shared.service';
import * as Plyr from 'plyr';
import { VideoPlayer } from '../../interfaces/videoPlayer';
import { BehaviorSubject, Subscription } from 'rxjs';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideoPlayerComponent implements OnInit, AfterViewInit, OnDestroy {

  YOUTUBE_EMBED_URL = 'https://www.youtube.com/embed/';

  videoPlayer: VideoPlayer;
  private videoHtmlElement: HTMLElement;
  private isLoadVideoFrameFirstTime = true;
  private videoPlayerStyleHight: string;

  @Input() videoType?: string;
  @Input() videoUrl?: string;
  @Input() isActive = false;
  @Input() isSwitchable = false;
  @Input() viewName = '';
  @Input() showViewName = false;
  @Input() hasExternalcontrolButtons = false;

  canUnmute = false;
  _canUnmute: Subscription;

  private playerOptions = {
    autoplay: false,
    playsinline: true,
    seekTime: 0, // set in the constructor
    volume: 0.5,
    muted: false,
    speed: { selected: 1, options: [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] },
    storage: { enabled: false, key: 'plyr_storage' },
    debug: false,
    keyboard: { focused: false, global: false }, // Handled in the project
    controls: ['play-large', 'play', 'mute', 'volume', 'download', 'fullscreen']
  };

  private _playerEvents: BehaviorSubject<{}>;

  constructor(private videoService: VideoService,
    private sharedService: SharedService,
    private domCtrl: DomController,
    private cd: ChangeDetectorRef) {
    this.videoPlayer = this.videoService.initVideoPlayer();
    this.playerOptions.seekTime = this.videoService.PLAYER_SEEK_TIME;
  }

  ngOnInit() {
    this.videoPlayer.playerId = this.videoService.generateUniqPlayerId();
    this.videoPlayer.isSwitchable = this.isSwitchable;
    this.videoPlayer.hasExternalcontrolButtons = this.hasExternalcontrolButtons;

    if (this.hasExternalcontrolButtons) {
      this._playerEvents = new BehaviorSubject({});
      this.videoPlayer.playerEvents = this._playerEvents.asObservable();
    }

    if (this.sharedService.isIosApp()) {
      this._canUnmute = this.videoService.canUnmute$.subscribe((can) => {
        this.canUnmute = can;
        this.cd.markForCheck();
      });
    }
  }

  ngAfterViewInit() {
    try {
      this.videoHtmlElement = document.getElementById(this.videoPlayer.playerId);
      const videoFrame: HTMLElement = this.createVideoFrame();
      this.loadVideoFrame(videoFrame);
      if (this.isActive && this.isSwitchable && this.hasExternalcontrolButtons) {
        this.videoService.setIsActivePlayerId(this.videoPlayer.playerId);
      }
    } catch (error) {
      console.error(error);
    }
  }

  private createVideoFrame(): HTMLElement {
    const frame: HTMLElement = document.createElement('iframe');
    frame.setAttribute('src', this.YOUTUBE_EMBED_URL + this.videoUrl);
    return frame;
  }

  private loadVideoFrame(videoFrame: HTMLElement) {
    // Make sure this action only fires once
    if (!this.isLoadVideoFrameFirstTime) {
      return;
    }

    this.isLoadVideoFrameFirstTime = false;
    this.videoHtmlElement.appendChild(videoFrame);
    this.videoPlayer.player = new Plyr('#' + this.videoPlayer.playerId, this.playerOptions);

    if (this.videoPlayer.player) {
      this.videoPlayer.videoUrl = this.videoUrl;
      this.videoPlayer.videoType = this.videoType;
      this.videoPlayer.playerComponent = this;
      this.videoService.registerPlayer(this.videoPlayer);
      this.setVideoPlayerStyle();

      this.videoPlayer.player.on('ready', event => {
        this.videoService.setPlayerDefaults(this.videoPlayer);
        if (this.hasExternalcontrolButtons) {
          this.sendPlayerEvent({ isReady: true });
          this.setVideoPlayerStyle();
        }
      });

      this.videoPlayer.player.on('play', event => {
        this.videoPlayer.isPlaying = true;
        this.videoService.pauseAllOthers(this.videoPlayer.playerId);
        if (!this.sharedService.isIosApp() || this.canUnmute) {
          this.videoPlayer.player.muted = false;
          this.videoService.canUnmuteVolumeSubject.next(false);
        }
        if (this.hasExternalcontrolButtons) {
          this.videoService.setIsActivePlayerId(this.videoPlayer.playerId);
          this.sendPlayerEvent({ isPlay: true });
        }
      });

      this.videoPlayer.player.on('pause', event => {
        this.videoPlayer.isPlaying = false;
        if (this.hasExternalcontrolButtons) {
          this.sendPlayerEvent({ isPause: true });
        }
      });

      this.videoPlayer.player.on('timeupdate', event => {
        if (this.hasExternalcontrolButtons) {
          this.sendPlayerEvent({ isTimeUpdate: true });
        }
      });

      this.videoPlayer.player.on('seeking', event => {
        if (this.hasExternalcontrolButtons) {
          this.sendPlayerEvent({ isSeeking: true });
        }
      });

      this.videoPlayer.player.on('volumechange', event => {
        if (!this.videoPlayer.player.muted) {
          this.videoService.canUnmuteVolumeSubject.next(false);
        }
      });

      this.videoPlayer.player.on('controlsshown', event => {
        this.videoService.controlsshownSubject.next(true);
      });

      this.videoPlayer.player.on('controlshidden', event => {
        this.videoService.controlsshownSubject.next(false);
      });
    }

  }

  getVideoPlayerStyleHight() {
    return this.videoPlayerStyleHight;
  }

  setVideoPlayerStyle() {
    if (!this.hasExternalcontrolButtons) {
      return;
    }
    const largeSizeH = 200;
    const largeSizeNoRangeButtons = 95;
    const heightDivider = this.videoService.isHeightSplitMode ? 2 : 1;
    const size = this.videoService.isRangeButtonsOn ? largeSizeH : largeSizeNoRangeButtons;

    const videoElements = document.getElementsByClassName('plyr__video-embed');
    this.setVideoPlayerHeight(videoElements, size, heightDivider);
  }

  private setVideoPlayerHeight(videoElements, size, heightDivider) {
    // tslint:disable-next-line:max-line-length
    const height = 'calc((100vh - ' + size + 'px) / ' + heightDivider + ')';
    let style = 'padding-bottom: 0 !important; height: ' + height + ' !important; width: 100% !important; transition: height 0.2s';
    this.videoPlayerStyleHight = height;
    if (this.sharedService.isLessThanMediumWindowWidth()) {
      style = '';
      this.videoPlayerStyleHight = 'inital';
    }
    let elHeight;
    this.domCtrl.write(() => {
      for (let i = 0; i < videoElements.length; i++) {
        const element = <HTMLElement>videoElements[i];
        elHeight = element.offsetHeight;
        element.setAttribute('style', style);
      }
    });
  }

  getId(): string {
    return this.videoPlayer.playerId;
  }

  sendPlayerEvent(event: {}) {
    if (this.hasExternalcontrolButtons) {
      this._playerEvents.next(event);
    }
  }

  destroyPlayer() {
    if (this.videoPlayer.player) {
      try {
        this.videoPlayer.player.destroy();
      } catch (e) {
        console.error(e);
      }
      this.videoService.unregisterPlayer(this.videoPlayer.playerId);
    }
  }

  unmute() {
    this.videoPlayer.player.muted = false;
  }

  ngOnDestroy() {
    this.destroyPlayer();
    if (this._playerEvents) {
      this._playerEvents.unsubscribe();
    }
    if (this._canUnmute) {
      this._canUnmute.unsubscribe();
    }
  }
}
