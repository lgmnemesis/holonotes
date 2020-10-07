import { Injectable, NgZone } from '@angular/core';
import { Platform, ToastController } from '@ionic/angular';
import { Project } from '../interfaces/project';
import { Subscription, BehaviorSubject, timer } from 'rxjs';
import { Timeline } from '../interfaces/timeline';
import { environment } from '../../environments/environment';
import { AnalyticsService } from './analytics.service';
import { Meta, Title } from '@angular/platform-browser';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Task } from '../interfaces/task';

export interface ResUpdateSubject {
  widthChanged?: boolean;
  widthRangeChanged?: boolean;
  freeHeightRangeChanged?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  // -----------------------------------
  // Global Params

  EXTRA_SMALL_WINDOW_WIDTH = 415;
  SMALL_WINDOW_WIDTH = 576;
  MEDIUM_WINDOW_WIDTH = 768;
  LARGE_WINDOW_WIDTH = 992;
  EXTRA_LARGE_WINDOW_WIDTH = 1200;
  MEDIUM_WINDOW_HEIGHT = 570;
  LARGE_WINDOW_HEIGHT = 650;

  inputNameMaxLength = 50;
  inputDescriptionMaxLength = 100;

  defaultToastDurationTime = 1500;
  defaultCoverImg = 'assets/imgs/default_cover.jpg';

  MAX_PROJECTS_NUMBER_NOT_PAYING_USER = 50;
  MAX_PROJECTS_NUMBER_PAYING_USER = 1000;

  MAX_NUM_OF_SUB_TAGS_LARGE = 10;
  MAX_NUM_OF_SUB_TAGS_SMALL = 5;

  PROJECT_FREE_HEIGHT = 100;
  PROJECT_FREE_HEIGHT_FOR_TIMELINE_SLIDE = 30;
  PROJECT_FOOTER_HEIGHT = 300;
  // -----------------------------------

  deferredPrompt: any;
  private currentWidth: number;
  private currentHeight: number;
  private prevWidth: number;
  private prevIsFreeHeightRes = false;
  private currentIsFreeHeightRes = false;
  private prevIsFreeHeightResForTimelineSlide = false;
  private currentIsFreeHeightResForTimelineSlide = false;
  navigationUrl = '';
  currentProject: Project;
  currentProjectSub = new BehaviorSubject<Project>(null);
  currentProject$ = this.currentProjectSub.asObservable();
  _currentProject: Subscription;
  activeBookmarkId: number;
  activeVideoId: number;
  private isMobilePlatform = false;
  private isIosPlatform = false;
  isHostListenerDisabled = false;
  currentCollectionId: string;
  projectLastUpdatedTime: number;
  _project: Subscription;
  timelineMap = new Map<string, Timeline[]>();
  projectUpdatedSubject = new BehaviorSubject([]);
  projectUpdated$ = this.projectUpdatedSubject.asObservable();
  showBookmarksForTag = new Map<string, boolean>();
  subTags: Timeline[] = [];
  screenResUpdatedSubject: BehaviorSubject<ResUpdateSubject> = new BehaviorSubject({});
  screenResUpdated$ = this.screenResUpdatedSubject.asObservable();
  loadingSpinner;
  loadingSpinnerSubject = new BehaviorSubject(false);
  loadingSpinner$ = this.loadingSpinnerSubject.asObservable();
  private isPwaApp = false;
  _navigationEvents: Subscription;
  timelinePointerBookmarkId = null;
  sharedChallenge: Task = null;
  alreadyJoinedSharedChallenge = false;
  showInfoTriggerSubject = new BehaviorSubject(null);
  showInfoTrigger$ = this.showInfoTriggerSubject.asObservable();
  canAddAsAppSubject = new BehaviorSubject(false);
  canAddAsApp$ = this.canAddAsAppSubject.asObservable();

  constructor(public platform: Platform,
    private toastCtrl: ToastController,
    public ngZone: NgZone,
    private analyticsService: AnalyticsService,
    private meta: Meta,
    private router: Router,
    private titleService: Title) {
      try {
        ngZone.runOutsideAngular(() => {
          const source = timer(0, 1000);
          source.subscribe(() => {
            if (platform) {
              this.manageScreenRes(platform);
              this.managePlatform(platform);
            }
          });
        });
      } catch (error) {
        console.error(error);
      }
  }

  showInfo() {
console.log(`

                                        ¶
¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶                        ¶
 ¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶            ¶¶      ¶¶    ¶¶
     ¶¶¶¶¶¶¶              ¶¶¶¶       ¶     ¶¶
     ¶¶¶¶¶¶¶         ¶¶¶ ¶¶¶¶¶  ¶    ¶¶    ¶¶
     ¶¶¶¶¶¶¶        ¶¶¶¶ ¶¶¶¶¶   ¶   ¶¶    ¶¶
     ¶¶¶¶¶¶¶        ¶¶¶¶ ¶¶¶¶¶   ¶   ¶¶    ¶¶
     ¶¶¶¶¶¶¶         ¶¶¶ ¶¶¶¶¶  ¶    ¶¶    ¶¶
     ¶¶¶¶¶¶¶              ¶¶¶¶       ¶     ¶¶
 ¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶            ¶¶      ¶¶    ¶¶
¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶¶                        ¶
                                        ¶

¶¶¶¶¶  ¶¶¶¶¶ ¶¶¶¶ ¶¶¶¶  ¶¶¶¶¶¶ ¶¶¶¶¶¶  ¶¶¶¶¶
 ¶¶¶¶  ¶¶¶¶   ¶¶   ¶¶  ¶¶¶       ¶¶   ¶¶   ¶¶
 ¶¶ ¶¶¶¶ ¶¶   ¶¶   ¶¶   ¶¶¶¶¶¶   ¶¶   ¶¶
 ¶¶  ¶¶  ¶¶   ¶¶   ¶¶       ¶¶¶  ¶¶   ¶¶   ¶¶
 ¶¶  ¶¶  ¶¶   ¶¶¶ ¶¶¶  ¶¶¶  ¶¶¶  ¶¶   ¶¶¶  ¶¶
¶¶¶¶ ¶¶ ¶¶¶¶   ¶¶¶¶¶   ¶¶¶¶¶¶¶ ¶¶¶¶¶¶  ¶¶¶¶¶

                holonotes.io

`);

    console.log(`Client Version: ${this.getClientVersion()}`);
  }

  private managePlatform(platform) {
    if (platform.is('mobile') || platform.is('mobileweb') ) {
      this.isMobilePlatform = true;
    } else {
      this.isMobilePlatform = false;
    }

    this.isIosPlatform = platform.is('ios');
  }

  private manageScreenRes(platform) {
    this.prevWidth = this.currentWidth;
    this.currentWidth = platform.width();
    this.currentHeight = platform.height();

    const prevWidthRes = this.getScreenWidthRange(this.prevWidth);
    const currentWidthRes = this.getScreenWidthRange(this.currentWidth);

    const projectVideoHeight = this.currentWidth / 1.777; // 16:9 video ratio
    const projectFooterHeight = this.PROJECT_FOOTER_HEIGHT;
    const freeHeight = this.currentHeight - projectVideoHeight - projectFooterHeight;
    this.prevIsFreeHeightRes = this.currentIsFreeHeightRes;
    this.prevIsFreeHeightResForTimelineSlide = this.currentIsFreeHeightResForTimelineSlide;
    this.currentIsFreeHeightRes = freeHeight > this.PROJECT_FREE_HEIGHT;
    this.currentIsFreeHeightResForTimelineSlide = freeHeight > this.PROJECT_FREE_HEIGHT_FOR_TIMELINE_SLIDE;

    if (this.prevWidth !== this.currentWidth) {
      this.screenResUpdatedSubject.next({widthChanged: true});
    }
    if (prevWidthRes !== currentWidthRes) {
      this.screenResUpdatedSubject.next({widthRangeChanged: true});
    }
    if (this.prevIsFreeHeightRes !== this.currentIsFreeHeightRes ||
        this.prevIsFreeHeightResForTimelineSlide !== this.currentIsFreeHeightResForTimelineSlide) {
      this.screenResUpdatedSubject.next({freeHeightRangeChanged: freeHeight});
    }

  }

  private getScreenWidthRange(width: number): number {
    if (width <= this.SMALL_WINDOW_WIDTH) {
      return 0;
    }
    if (width <= this.MEDIUM_WINDOW_WIDTH) {
      return 1;
    }
    if (width <= this.LARGE_WINDOW_WIDTH) {
      return 2;
    }
    if (width <= this.EXTRA_LARGE_WINDOW_WIDTH) {
      return 3;
    }
    return 3;
  }

  getClientVersion() {
    return environment.clientVersion;
  }

  isMobileApp() {
    return this.isMobilePlatform;
  }

  isIosApp() {
    return this.isIosPlatform;
  }

  isPwa(): boolean {
    return this.isPwaApp;
  }

  setIsPwa(isPwa: boolean) {
    this.isPwaApp = isPwa;
  }

  isFreeHeightRes() {
    return this.currentIsFreeHeightRes;
  }

  isFreeHeightResForTimelineSlide() {
    return this.currentIsFreeHeightResForTimelineSlide;
  }

  isLessThanMediumWindowHeight(): boolean {
    return this.currentHeight < this.MEDIUM_WINDOW_HEIGHT;
  }

  isLargeWindowHeight(): boolean {
    return this.currentHeight >= this.LARGE_WINDOW_HEIGHT;
  }

  isLessThanSmallWindowWidth(): boolean {
    return this.currentWidth < this.SMALL_WINDOW_WIDTH;
  }

  isLessThanExtraSmallWindowWidth(): boolean {
    return this.currentWidth < this.EXTRA_SMALL_WINDOW_WIDTH;
  }

  isLessThanMediumWindowWidth(): boolean {
    return this.currentWidth < this.MEDIUM_WINDOW_WIDTH;
  }

  isLessThanLargeWindowWidth(): boolean {
    return this.currentWidth < this.LARGE_WINDOW_WIDTH;
  }

  isLargeWindowWidth(): boolean {
    return this.currentWidth >= this.LARGE_WINDOW_WIDTH;
  }

  isExtraLargeWindowWidth(): boolean {
    return this.currentWidth >= this.EXTRA_LARGE_WINDOW_WIDTH;
  }

  eventShouldBeTrigger(event: any): boolean {
    if (event.keyCode || event.charCode) {
      // keyboard event
      if (event.keyCode === 13) {
       // Enter key
       return true;
      }
      return false;
    }
    // If this is a keyboard event then its handled globaly per page (project page for now)
    return event.screenX === 0 && event.screenY === 0 ? false : true;
  }

  setNavigatedFrom(from: string) {
    this.navigationUrl = from;
  }

  generateId(): number {
    return new Date().getTime();
  }

  projectUnsubscribe() {
    if (this._project) {
      this._project.unsubscribe();
      this.currentProjectSub.next(null);
    }
  }

  async presentToast(
    message: string, duration: number = this.defaultToastDurationTime, cssClass = 'app-toast-message'): Promise<HTMLIonToastElement> {
    const toast = await this.toastCtrl.create({
      message: message,
      duration: duration,
      color: 'primary',
      mode: 'ios',
      position: 'top',
      cssClass: cssClass
    });
    toast.present().catch((error) => {
      console.error(error);
    });
    return toast;
  }

  sortBookmarksByTime(bookmarks: Timeline[]) {
    return bookmarks.slice().sort((a, b) => {
      if (a.source_start_at < b.source_start_at) {
        return -1;
      } else if (a.source_start_at === b.source_start_at) {
        if (a.lesson_start_at === b.lesson_start_at) {
          return a.lesson_end_at > b.lesson_end_at ? -1 : 1;
        }
        return a.lesson_start_at < b.lesson_start_at ? -1 : 1;
      }
      return 1;
    });
  }

  updateTimeLineWithMenuMap() {
    const bookmarks = this.currentProject.bookmarks;
    const sorted = this.sortBookmarksByTime(bookmarks);
    const timelineMap = this.timelineMap;
    let subBookmarks = [];
    const unlabeled = [];
    const unlabeledName = '999_Unlabeled';
    let foundActive = false;

    timelineMap.clear();
    const map = new Map<string, Timeline[]>();
    let counter = 0;

    sorted.forEach(element => {
      let tagName = element.tag_name;
      if (!tagName) {
        unlabeled.push(element);
      } else {
        tagName = tagName.toLowerCase();
        subBookmarks = map.get(tagName) || [];
        subBookmarks.push(element);
        map.set(tagName, subBookmarks);
      }
      if (tagName && this.activeBookmarkId === element.id) {
        this.showBookmarksForTag.set(tagName, true);
        foundActive = true;
      }
    });

    map.forEach((value, key) => {
      // Anglular is sorting by name in ngFor. so we need the prefix to keep the order
      const prefix = counter < 10 ? `00${counter}` : counter < 99 ? `0${counter}` : counter;
      const tagName = prefix + '_' + key;
      counter++;
      timelineMap.set(tagName, value);
    });

    // Adding unlabeled tag at the end
    const arr = timelineMap.get(unlabeledName) || [];
    unlabeled.forEach(element => {
      arr.push(element);
      timelineMap.set(unlabeledName, arr);
      if (!foundActive && this.activeBookmarkId === element.id) {
        this.showBookmarksForTag.set(unlabeledName, true);
      }
    });

    this.buildSubTags();
  }

  buildSubTags() {
    this.subTags = [];
    const tags = [];
    this.currentProject.bookmarks.forEach(bk => {
      if (!bk.name && !bk.tag_name && !bk.marker_name) {
        tags.push(bk);
      }
    });
    this.subTags = tags.slice(-this.getMaxNumOfSubTags());
  }

  getMaxNumOfSubTags() {
    return this.isLessThanMediumWindowWidth() ?
      this.MAX_NUM_OF_SUB_TAGS_SMALL : this.MAX_NUM_OF_SUB_TAGS_LARGE;
  }
  tagWasPressed(tagName: string): boolean {
    if (!this.showBookmarksForTag.get(tagName)) {
      this.showBookmarksForTag.set(tagName, true);
      return true;
    } else {
      const value = this.showBookmarksForTag.get(tagName);
      this.showBookmarksForTag.set(tagName, !value);
      return !value;
    }
  }

  getCssSuffix(): string {
    return this.isLessThanMediumWindowWidth() ? '-small-size' : '-medium-size';
  }

  getMaxProjectsToShow() {
    return this.getMaxProjectsToShowInCollection();
  }

  getMaxProjectsToShowInCollection() {
    // TODO: Check if user is a paying user or not
    // TODO: Need to be configurable parameters in firestore?  implement remote configuration managment
    // TODO: Also, enforce this on firestore (backend side)
    return this.MAX_PROJECTS_NUMBER_PAYING_USER;
  }

  createSearchTagsForProject(project: Project) {
    const tags = [];
    if (project && project.name) {
      this.getTagsFrom(project.name, tags);
    }
    if (project && project.artist) {
      this.getTagsFrom(project.artist, tags);
    }
    return tags;
  }

  private getTagsFrom(name: string, tags: string[]): string[] {
    const words: string[] = name.split(/\s+/);
    for (let index = 0; index < words.length; index++) {
      const line: string[] = words.slice(index, words.length);
      const join = line.join(' ').toLowerCase();
      tags.push(join);
    }
    for (let index = words.length - 1; index > 0; index--) {
      const line: string[] = words.slice(0, index);
      const join = line.join(' ').toLowerCase();
      tags.push(join);
    }
    return tags;
  }

  capitalize(phrase) {
    return phrase
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  enableDisableKeyboard(isEnabled) {
    try {
      document.onkeydown = function (e) {
        return isEnabled;
      };
    } catch (error) {
      console.error(error);
    }
  }

  unloadSpinner() {
    if (this.loadingSpinner) {
      this.loadingSpinner.dismiss()
      .then((res) => {
        this.loadingSpinner = null;
        this.loadingSpinnerSubject.next(false);
      })
      .catch((error) => {
        console.error(error);
      });
    }
  }

  promptForPwaInstallation() {
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      // Wait for the user to respond to the prompt
      this.deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          this.analyticsService.sendAddAsPWAAcceptedEvent();
        } else {
          this.analyticsService.sendAddAsPWADismissedEvent();
        }
        this.deferredPrompt = null;
      });
    }
  }

  subsribeToNavigationEvents() {
    const navEndEvents = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    );
    this._navigationEvents = navEndEvents.subscribe((event: NavigationEnd) => {
      const currentPath = event.urlAfterRedirects;
      const isProjectPage = currentPath.startsWith('/project/');
      this.isHostListenerDisabled = !isProjectPage;
      if (isProjectPage) {
        this.setProjectTitle();
      } else {
        this.setMetaData(currentPath);
      }
      // Sending router events to google analytics
      const options = {'page_path':  currentPath};
      this.analyticsService.sendNavigationEvents(options);
    });
  }

  setMetaData(path: string) {
    const title = 'Holonotes';
    let description = 'Perfecting Your Repertoire. Holonotes lets you organize and learn your favorite songs to play, in a way that will help you expand your repertoire day by day. Work on your favorite songs, Join our challenges to stay motivated, Reach your goals one step at a time. Manage your music video lessons - Import your videos into dedicated projects and collections. Work on lessons others have created and shared. Be organized and achieve more. Have more control under your fingers - Bookmark relevant sections, add markers to video timeline for easy access, create loops, slow down video. Stay on track - Build routines, monitor your time, to keep you on track and be more productive. Collaborate with others';

    if (path === '/explore') {
      description = 'Holonotes lets you organize and learn your favorite songs to play, in a way that will help you expand your repertoire day by day. Work on your favorite songs. See what others are playing. Search for songs to learn';
    } else if (path === '/news-feed') {
      description = 'Holonotes lets you organize and learn your favorite songs to play, in a way that will help you expand your repertoire day by day. Work on your favorite songs. Browse the latest news on music, guitar lessons, guitar gear and more';
    } else if (path.match(/(\/challenges)/)) {
      description = 'Holonotes lets you organize and learn your favorite songs to play, in a way that will help you expand your repertoire day by day. Work on your favorite songs. Join a group challenge, share your progress with others, or create your own';
    }

    this.titleService.setTitle(title);
    this.meta.updateTag({ name: 'title', content: `${title}`});
    this.meta.updateTag({ name: 'description', content: description });
  }

  setProjectTitle() {
    const project = this.currentProject;
    if (project) {
      const artist = project.artist && project.artist.length > 0 ? ` by ${project.artist}` : '';
      const title = `${project.name}${artist}`;
      const description = project.preview_description || 'Holonotes lets you organize and learn your favorite songs to play. Have more control under your fingers - Bookmark relevant sections, add markers to video timeline for easy access, create loops, slow down video.';
      this.titleService.setTitle(`Holonotes - ${title}`);
      this.meta.updateTag({ name: 'title', content: `${title}`});
      this.meta.updateTag({ name: 'description', content: `${description}`});
    }
  }

  createStrHash(str: string): string {
    // tslint:disable-next-line: no-bitwise
    return `${Array.from(str).reduce((s, c) => Math.imul(31, s) + c.charCodeAt(0) | 0, 0)}`;
  }

  copyLinkUrl(parentElement: HTMLElement, link?: string) {
    try {
      const url = link;

      const el = document.createElement('textarea');
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-99999px';
      el.style.opacity = '0';
      parentElement.appendChild(el);
      el.value = url;

      // Support for ios
      if (this.isIosApp()) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
        el.setSelectionRange(0, 999999);
      } else {
        el.select();
      }

      document.execCommand('copy');
      parentElement.removeChild(el);

      const message = 'Link copied to clipboard';
      this.presentToast(message, 2000);
    } catch (error) {
      console.error(error);
    }
  }

  styleIonScrollbars(element: any) {
    if (this.isMobileApp()) {
      return;
    }
    try {
      const stylesheet = `
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar,
        ::-webkit-scrollbar-thumb {
          border-radius: 8px;
          overflow: visible;
        }
        ::-webkit-scrollbar-thumb {
          background: var(--ion-color-secondary-shade);
        }
      `;

      const styleElement = element.shadowRoot.querySelector('style');

      if (styleElement) {
        styleElement.append(stylesheet);
      } else {
        const barStyle = document.createElement('style');
        barStyle.append(stylesheet);
        element.shadowRoot.appendChild(barStyle);
      }
    } catch (error) {
      console.error(error);
    }
  }

  setPointerTimeline(id: string, time: number) {
    const bookmarks = this.currentProject ? this.currentProject.bookmarks : null;
    const current = this.timelinePointerBookmarkId;
    let found = false;
    if (bookmarks) {
      bookmarks.forEach(t => {
        if (t.source_isActivePlayer && t.source_id === id) {
          if (time >= t.source_start_at && time <= t.source_end_at) {
            this.timelinePointerBookmarkId = t.id;
            found = true;
          }
        } else if (t.lesson_isActivePlayer && t.lesson_id === id) {
          if (time >= t.lesson_start_at && time <= t.lesson_end_at) {
            this.timelinePointerBookmarkId = t.id;
            found = true;
          }
        }
      });
      if (!found) {
        this.timelinePointerBookmarkId = null;
      }
      if (current !== this.timelinePointerBookmarkId) {
        this.projectUpdatedSubject.next(['bookmarks']);
      }
    }
  }

  create_UUID(): string {
    let dt = new Date().getTime();
    const uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        // tslint:disable-next-line: no-bitwise
        const r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        // tslint:disable-next-line: no-bitwise
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
    return uuid;
  }
}
