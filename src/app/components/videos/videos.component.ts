import { Component, OnInit, Input, Output, OnDestroy, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { PopoverController, ActionSheetController } from '@ionic/angular';
import { VideosMoreComponent } from '../videos-more/videos-more.component';
import { VideoService } from '../../services/video.service';
import { Video } from '../../interfaces/video';
import { Subscription } from 'rxjs';
import { fade, translateYDown } from '../../models/animations';
import { NavigationEnd, Router } from '@angular/router';
import { ProjectOptionsService } from '../../services/project-options.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-videos',
  templateUrl: './videos.component.html',
  styleUrls: ['./videos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYDown
  ]
})
export class VideosComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input()
  set inputEvent(value: any) {
    if (value.type && value.type === 'open') {
      this.open();
    } else if (value.type && value.type === 'add') {
      this.add();
    }
  }

  @Output() selectedEvent = new EventEmitter();

  YOUTUBE_URL = environment.YOUTUBE_URL;

  _videosUpdated: Subscription;
  _router: Subscription;
  actionSheet: HTMLIonActionSheetElement;
  popover: HTMLIonPopoverElement;


  constructor(public sharedService: SharedService,
    private popoverCtrl: PopoverController,
    private actionSheetCtrl: ActionSheetController,
    private videoService: VideoService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private projectOptionsService: ProjectOptionsService) { }

  ngOnInit() {
    // Disable default 'space key' behaivur of scolling down the page when pressed.
    try {
      window.onkeydown = function(e) {
        if (e.code === 'Space' && e.target === document.body) {
          e.preventDefault();
        }
      };
    } catch (error) {
      console.error(error);
    }

    this._videosUpdated = this.sharedService.projectUpdated$.subscribe((res) => {
      if (res.includes('videos')) {
        this.cd.markForCheck();
      }
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        if (this.actionSheet) {
          this.actionSheet.dismiss().catch(error => console.error(error));
        }
        if (this.popover) {
          this.popover.dismiss().catch(error => console.error(error));
        }
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#videos-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  open() {
    this.selectedEvent.next({type: 'manage-all-videos'});
  }

  add() {
    this.selectedEvent.next({type: 'addVideo'});
  }

  private playOn(id: number, isOnSplayer: boolean) {
    this.selectedEvent.next({type: 'playOnVideo', id: id, 'isOnSplayer': isOnSplayer});
  }

  private editVideo(id: number) {
    this.selectedEvent.next({type: 'editVideo', id: id});
  }

  private copyURL(id: number, element?: HTMLElement) {
    const videos = this.sharedService.currentProject.videos;
    const video = videos.find((bm) => bm.id === id);
    if (video) {
      const url = `${this.YOUTUBE_URL}${video.video_id}`;
      try {
        const el = element || document.documentElement;
        this.projectOptionsService.copyLinkUrl(el, url);
      } catch (error) {
        console.error(error);
      }
    }
  }

  private delete(id: number) {
    this.selectedEvent.next({type: 'deleteVideo', id: id});
  }

  videoSelected(event, id: number) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.selectedEvent.next({type: 'videoSelected', id: id});
    }
  }

  isButtonActive(id: number): boolean {
    return id === this.sharedService.activeVideoId ? true : false;
  }

  moreButtonWasPressed(event, video) {
    event.stopPropagation();
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.videoService.showViewName = true;
      if (this.sharedService.isLessThanMediumWindowWidth()) {
        this.presentActionSheet(video.id);
      } else {
        this.presentPopover(event, VideosMoreComponent, video);
      }
    }
  }

  async presentActionSheet(id: number) {
    this.actionSheet = await this.actionSheetCtrl.create({
      cssClass: 'videos-component-action-sheet',
      buttons:
        [
          {
            text: 'Play On ' + this.videoService.sourcePlayerViewName,
            icon: 'play',
            cssClass: 'action-sheet-open',
            handler: () => {
              this.playOn(id, true);
              this.videoService.showViewName = false;
            }
          },
          {
            text: 'Play On ' + this.videoService.lessonPlayerViewName,
            icon: 'play',
            cssClass: 'action-sheet-open',
            handler: () => {
              this.playOn(id, false);
              this.videoService.showViewName = false;
            }
          },
          {
            text: 'Edit Video',
            icon: 'create',
            cssClass: 'action-sheet-open',
            handler: () => {
              this.editVideo(id);
              this.videoService.showViewName = false;
            }
          },
          {
            text: 'Copy Video URL',
            icon: 'copy',
            cssClass: 'copy-link-url',
            handler: () => {
              // handled by running copyLinkUrl() inside a click listener
              const el = <HTMLInputElement>document.querySelector
              ('.videos-component-action-sheet .copy-link-url');
              this.copyURL(id, el);
              this.videoService.showViewName = false;
            }
          },
          {
            text: 'Delete Video',
            icon: 'trash',
            cssClass: 'action-sheet-delete',
            handler: () => {
              this.delete(id);
              this.videoService.showViewName = false;
            }
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
            handler: () => {
              this.videoService.showViewName = false;
            }
          }
        ]
    });
    await this.actionSheet.present();
  }

  async presentPopover(ev: Event, component: any, video) {
    this.popover = await this.popoverCtrl.create({
      component: component,
      componentProps: {video: video},
      event: ev,
      cssClass: 'videos-popover',
      mode: 'ios'
    });
    this.popover.onDidDismiss()
    .then((res) => {
      if (res && res.data) {
        if (res.data.action === 'playOn') {
          this.playOn(video.id, res.data.isOnSplayer);
        } else if (res.data.action === 'edit') {
          this.editVideo(video.id);
        } else if (res.data.action === 'copyURL') {
          this.copyURL(video.id);
        } else if (res.data.action === 'delete') {
          this.delete(video.id);
        }
      }
      this.videoService.showViewName = false;
    })
    .catch((error) => {
      console.error(error);
      this.videoService.showViewName = false;
    });

    return await this.popover.present().catch((error) => {
      console.error(error);
    });
  }

  trackByKey(i, pair) {
    return pair.key;
  }

  trackById(i, video: Video) {
    return video.id;
  }

  ngOnDestroy() {
    if (this._videosUpdated) {
      this._videosUpdated.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
