import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { environment } from '../../../environments/environment';
import { Video } from '../../interfaces/video';
import { SearchVideosService } from '../../services/search-videos.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manage-videos',
  templateUrl: './manage-videos.component.html',
  styleUrls: ['./manage-videos.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageVideosComponent implements OnInit, OnDestroy {

  BASE_URL = environment.BASE_URL;
  YOUTUBE_URL = environment.YOUTUBE_URL;

  modalTitle = 'Add Video';
  currentURL: string;
  editFirstValue = '';
  nameMaxLength: number;
  showMore = false;
  title = '';
  thumbnail_url = '';
  video_id = '';
  isSearching = false;
  editedVideo: Video;
  searchRes = [];
  canSave = false;
  _router: Subscription;

  constructor(private modalCtrl: ModalController,
    private navParams: NavParams,
    private sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private searchVideosService: SearchVideosService,
    private router: Router) { }

  ngOnInit() {
    this.nameMaxLength = this.sharedService.inputNameMaxLength + 250;
    this.editedVideo = this.navParams.get('video');
    if (this.editedVideo) { // meaning, edit mode
      this.modalTitle = 'Edit Video';
      this.editFirstValue =  this.YOUTUBE_URL + this.editedVideo.video_id;
      this.title = this.editedVideo.title;
      this.thumbnail_url = this.editedVideo.thumbnail_url;
      this.video_id = this.editedVideo.video_id;
      this.showMore = true;
    } else {
      this.editFirstValue = this.sharedService.currentProject.name;
      this.doSearch(this.editFirstValue);
    }

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.close();
      }
    });
  }

  inputId(event) {
    const value = event.detail.value;

    if (value.trim() === '') {
      this.clear();
      return;
    }
    this.doSearch(value);
  }

  doSearch(value: string) {

    if (this.isSearching) {
      return;
    }
    this.isSearching = true;

    // Validate URL
    const matched = this.searchVideosService.isVideoUrl(value);
    // Get Thumbnail
    if (matched) {
      this.currentURL = value;
      this.searchVideosService.getThumbnail(this.currentURL).then((result) => {
        if (result) {
          this.title = result.title;
          this.thumbnail_url = result.thumbnail_url;
          this.video_id = result.video_id;
          this.showMore = true;
          this.canSave = true;
          this.searchRes = [];
        } else {
          this.clear();
        }
        this.isSearching = false;
        this.markForCheck();
      });

    // Search youtube video
    } else {
      this.searchVideosService.searchVideos(value).then((result) => {
        if (result) {
          this.searchRes = result;
          this.isSearching = false;
          this.markForCheck();
        } else {
          this.clear();
        }
      });
    }
  }

  private clear() {
    this.isSearching = false;
    this.title = '';
    this.video_id = '';
    this.thumbnail_url = '';
    this.showMore = false;
    this.searchRes = [];
    this.canSave = false;
    this.markForCheck();
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  inputName(event) {
    this.title = event.detail.value;
    if (this.title && this.title.trim() !== this.editedVideo.title) {
      this.canSave = true;
    }
  }

  clickedOnSearchRes(item: any) {
    this.showMore = true;
    this.title = item.snippet.title;
    const thumbnails = item.snippet.thumbnails;
    this.thumbnail_url = thumbnails.high ? thumbnails.high.url : thumbnails.default.url;
    this.video_id = item.id.videoId;
    this.canSave = true;
    this.save();
  }

  close(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  save() {
    if (this.canSave) {
      const id = this.editedVideo ? this.editedVideo.id : this.sharedService.generateId();
      const video = {
        id: id,
        video_id: this.video_id,
        title: this.title,
        thumbnail_url: this.thumbnail_url
      };
      const data = { shouldUpdate: true, video: video };
      this.close(data);
    }
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
