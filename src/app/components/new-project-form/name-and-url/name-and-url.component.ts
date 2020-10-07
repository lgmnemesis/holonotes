import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { fade, translateYDown, translateYUp } from '../../../models/animations';
import { SharedStoreService } from '../../../services/shared-store.service';
import { NewProjectViews } from '../../../enums/new-project-views';
import { SearchVideosService } from '../../../services/search-videos.service';
import { Thumbnail } from '../../../interfaces/thumbnail';
import { Video } from '../../../interfaces/video';
import { SharedService } from '../../../services/shared.service';
import { BehaviorSubject, Subscription, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';

@Component({
  selector: 'app-name-and-url',
  templateUrl: './name-and-url.component.html',
  styleUrls: ['./name-and-url.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYDown,
    translateYUp
  ]
})
export class NameAndUrlComponent implements OnInit, OnDestroy {

  @Output() nextEvent = new EventEmitter();

  inputDebounceEventSubject = new BehaviorSubject(null);
  inputDebounceEvent$ = this.inputDebounceEventSubject.asObservable();
  _inputDebounceEvent: Subscription;

  name = '';
  isUrl = false;
  canNext = false;
  isInputFocused = false;
  thumbnail: Thumbnail;
  isSearching = false;
  errorMessage = '';
  inputNameMaxLength = 0;
  searchResult = [];
  isSearchUrl = false;
  isShowSelectedVideo = false;

  constructor(public sharedStoreService: SharedStoreService,
    private searchVideosService: SearchVideosService,
    private sharedService: SharedService,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.inputNameMaxLength = this.sharedService.inputNameMaxLength;

    this._inputDebounceEvent = this.inputDebounceEvent$
    .pipe(debounce(() => timer(600)))
    .subscribe((event) => {
      if (event) {
        this.setNameAndUrl();
      }
    });

    this.checkIfCanNext();

  }

  inputName(event) {
    this.name = event.detail.value;
    this.sharedStoreService.getNewProjectStore().name = this.name;
    this.isSearching = true;
    this.inputDebounceEventSubject.next(true);
  }

  thumbnailInputName(event) {
    this.thumbnail.name = event.detail.value;
    this.sharedStoreService.getNewProjectStore().name = this.thumbnail.name;
    this.checkIfCanNext();
  }

  thumbnailInputArtist(event) {
    this.thumbnail.artist = event.detail.value;
    this.sharedStoreService.getNewProjectStore().artist = this.thumbnail.artist;
  }

  setNameAndUrl() {
    const isVideoUrl = this.searchVideosService.isVideoUrl(this.name);
    this.isSearching = true;
    this.isUrl = false;
    this.isShowSelectedVideo = false;
    this.errorMessage = '';
    if (this.thumbnail) {
      this.thumbnail.name = '';
    }
    this.checkIfCanNext();
    if (isVideoUrl) {
      this.searchVideosService.getThumbnail(this.name).then((result) => {
        if (!result || !result.title) {
          this.canNext = false;
          this.errorMessage = 'Can not find video. please check that the link is correct.';
          this.isSearching = false;
          this.cd.markForCheck();
          return;
        }
        this.errorMessage = '';
        this.isSearchUrl = false;
        this.isUrl = true;
        this.thumbnail = result;
        const videoTitle = this.thumbnail.title;
        const videoId = this.thumbnail.video_id;
        const tUrl = this.thumbnail.thumbnail_url;
        this.showSelectedVideo(videoTitle, videoId, tUrl);
      });
    } else if (this.name && this.name.trim()) {
      // this.errorMessage = 'Please check that the link is correct.';
      // this.isUrl = false;
      this.searchVideosService.searchVideos(this.name).then((result) => {
        if (result) {
          this.searchResult = result;
          this.isSearchUrl = true;
        }
        this.isSearching = false;
        this.cd.markForCheck();
      });
      this.checkIfCanNext();
    } else {
      this.isSearching = false;
      if (this.thumbnail) {
        this.thumbnail.name = '';
      }
      this.checkIfCanNext();
    }
  }

  clickedOnSearchRes(item: any) {
    const videoTitle = item.snippet.title;
    const videoId = item.id.videoId;
    const tUrl = item.snippet.thumbnails.high.url;
    this.thumbnail = {};
    this.showSelectedVideo(videoTitle, videoId, tUrl);
  }

  showSelectedVideo(videoTitle: string, videoId: string, tUrl: string): boolean {
    const {name, artist} = this.searchVideosService.getFromTitle(videoTitle);
    this.thumbnail.name = name ? name.slice(0, this.inputNameMaxLength) : '';
    this.thumbnail.artist = artist ? artist.slice(0, this.inputNameMaxLength) : '';
    this.thumbnail.thumbnail_url = tUrl;
    this.sharedStoreService.getNewProjectStore().name = this.thumbnail.name;
    this.sharedStoreService.getNewProjectStore().artist = this.thumbnail.artist;
    const video: Video = {
      id: this.sharedService.generateId(),
      video_id: videoId,
      title: videoTitle,
      thumbnail_url: tUrl
    };
    const videos: Video[] = [];
    videos.push(video);
    this.sharedStoreService.getNewProjectStore().videos = videos;
    this.isSearching = false;
    this.isShowSelectedVideo = true;
    return this.checkIfCanNext();
  }

  switchNameAndArtist() {
    const {name, artist} = this.thumbnail;
    this.thumbnail.name = artist;
    this.thumbnail.artist = name;
  }

  nextOnEnter(event) {
    if (event.keyCode === 13 && this.canNext) {
      this.next();
    }
  }

  inputFocused(isFocused: boolean) {
    this.isInputFocused = isFocused;
  }

  checkIfCanNext(): boolean {
    this.canNext = false;
    if (this.thumbnail && this.thumbnail.name && this.thumbnail.name.trim().length > 1) {
      this.canNext = true;
    }
    this.cd.markForCheck();
    return this.canNext;
  }

  cancel() {
    this.nextEvent.next(NewProjectViews.None);
  }

  back() {
    if (this.isShowSelectedVideo) {
      this.isShowSelectedVideo = false;
    } else {
      this.cancel();
    }
    if (this.thumbnail) {
      this.thumbnail.name = '';
    }
    this.checkIfCanNext();
  }

  next() {
    this.nextEvent.next(NewProjectViews.Finish);
  }

  ngOnDestroy() {
    if (this._inputDebounceEvent) {
      this._inputDebounceEvent.unsubscribe();
    }
  }

}
