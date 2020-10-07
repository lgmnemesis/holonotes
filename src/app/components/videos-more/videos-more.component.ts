import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, NavParams } from '@ionic/angular';
import { VideoService } from '../../services/video.service';

@Component({
  selector: 'app-videos-more',
  templateUrl: './videos-more.component.html',
  styleUrls: ['./videos-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VideosMoreComponent implements OnInit, OnDestroy {

  constructor(private popoverCtrl: PopoverController,
    private videoService: VideoService,
    private navParams: NavParams) {}

  isOnSplayer = false;
  isOnLplayer = false;
  sourcePlayerViewName;
  lessonPlayerViewName;

  ngOnInit() {
    this.sourcePlayerViewName = this.videoService.sourcePlayerViewName;
    this.lessonPlayerViewName = this.videoService.lessonPlayerViewName;

    const video = this.navParams.get('video');
    const sPlayer = this.videoService.getPlayerById(this.videoService.sPlayerId);
    const lPlayer = this.videoService.getPlayerById(this.videoService.lPlayerId);
    if (video.video_id === sPlayer.videoUrl) {
      this.isOnSplayer = true;
    }
    if (video.video_id === lPlayer.videoUrl) {
      this.isOnLplayer = true;
    }
  }

  playOn(isOnSplayer) {
    this.close({action: 'playOn', isOnSplayer: isOnSplayer});
  }

  edit() {
    this.close({action: 'edit'});
  }

  copyURL() {
    this.close({action: 'copyURL'});
  }

  delete() {
    this.close({action: 'delete'});
  }

  close(data?: any) {
    this.popoverCtrl.dismiss(data);
  }

  ngOnDestroy() {
  }
}
