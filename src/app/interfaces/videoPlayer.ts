import { Observable } from 'rxjs';
import { VideoPlayerComponent } from '../components/video-player/video-player.component';

export interface VideoPlayer {
  player: any;
  playerId?: string;
  videoUrl: string;
  videoType: string;
  isPlaying: boolean;
  playerSpeed: number;
  playerVolume?: number;
  isSwitchable?: boolean;
  hasExternalcontrolButtons?: boolean;
  playerCurrentTime?: number;
  loop: {
    isLoopOn: boolean,
    startTimeLoop: number,
    endTimeLoop: number
  };
  playerEvents: Observable<{ isReady?: boolean, isPlay?: boolean, isPause?: boolean, isTimeUpdate?: boolean, seeking?: boolean }>;
  playerComponent?: VideoPlayerComponent;
}

