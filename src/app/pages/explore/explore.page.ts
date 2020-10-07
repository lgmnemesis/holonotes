import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { Subscription } from 'rxjs';
import { Project } from '../../interfaces/project';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { InfiniteScrollingService } from '../../services/infinite-scrolling.service';
import { BatchScroll } from '../../interfaces/batchScroll';
import { ProjectOptionsService } from '../../services/project-options.service';
import { NavController, IonSlides } from '@ionic/angular';
import { fade, translateXLeft } from '../../models/animations';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-page-explore',
  templateUrl: 'explore.page.html',
  styleUrls: ['explore.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateXLeft
  ]
})
export class ExplorePage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(CdkVirtualScrollViewport, { static: true }) viewport: CdkVirtualScrollViewport;
  @ViewChild(IonSlides, { static: true }) tagSlider: IonSlides;

  slideOpts: any = {};

  showHomeButton = true;
  showSearchBarButton = true;
  _feed: Subscription;
  feed: Project[];
  defaultCoverImg = this.sharedService.defaultCoverImg;
  canPresent = true;
  searchText = '';
  currentBatchParams: BatchScroll;
  tags: string[] = [];
  isEmptySearch = false;
  lastSearchText = '';
  preLastSearchText = '';
  isSearching = false;
  _screenRes: Subscription;
  _router: Subscription;
  activeTag = '';
  isActiveProfileButton = false;
  isActiveSearchButton = false;
  isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
  isSearchBarFocused = false;

  constructor(public sharedService: SharedService,
    public authService: AuthService,
    private navCtrl: NavController,
    private databaseService: DatabaseService,
    private infiniteScrollingService: InfiniteScrollingService,
    private cd: ChangeDetectorRef,
    private projectOptionsService: ProjectOptionsService,
    private router: Router) {}

  ngOnInit() {
    const batchParams = this.getDefaultBatchParams();
    this.reloadInfiniteScroll(batchParams, true);

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
        this.markForCheck();
      }
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        if (this.projectOptionsService.actionSheet) {
          this.projectOptionsService.actionSheet.dismiss().catch(error => console.error(error));
        }
      }
    });
  }

  ngAfterViewInit() {
    this.isSearching = true;
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  getDefaultBatchParams(): BatchScroll {
    return {
      for: 'projectsForFeed'
    };
  }

  reloadInfiniteScroll(batchParams: BatchScroll, fromInit?: boolean) {
    if (!fromInit) {
      this.isSearching = true;
    }
    if (this._feed) {
      this._feed.unsubscribe();
    }
    batchParams = this.infiniteScrollingService.init(batchParams);

    this._feed = batchParams.infinite.subscribe((projects) => {
      this.feed = projects;
      this.buildTags();
    });
    this.currentBatchParams = batchParams;
  }

  buildTags() {
    const tags = [];
    this.isEmptySearch = true;
    this.feed.forEach(project => {
      if (!project.dontShow) {
        this.isEmptySearch = false;
        const artist = project.artist;
        if (artist) {
          tags[artist.toLowerCase()] = '';
        }
      }
    });
    this.tags = Object.keys(tags).slice(0, 20);
    this.isSearching = false;
    this.slideOpts = this.getDefaultSlideOpts();
    this.slideOpts.centeredSlides = this.tags.length === 1;
    this.markForCheck();
    setTimeout(() => {
      this.tagSlider.update()
      .then(() => {
        this.markForCheck();
      })
      .catch((error) => {
        console.error(error);
        this.markForCheck();
      });
    }, 0);
  }

  getDefaultSlideOpts() {
    return {
      effect: 'slide',
      slidesPerView: 'auto',
      spaceBetween: 5,
      breakpointsInverse: true,
      freeMode: true,
      grabCursor: false,
      centeredSlides: false
    };
  }

  updateFeed() {
    this.activeTag = '';
    this.isEmptySearch = false;
    this.lastSearchText = '';
    this.preLastSearchText = '';
    const batchParams = this.getDefaultBatchParams();
    this.reloadInfiniteScroll(batchParams);
    this.viewport.scrollToIndex(0);
  }

  gotoProject(project: Project) {
    this.sharedService.setNavigatedFrom('/explore');
    this.databaseService.subscribeToProjectIfOwner(project);
    this.navCtrl.navigateForward('project/' + project.id);
  }

  nextScrollBatch(event) {
    const last = this.feed ? this.feed[this.feed.length - 1] : null;
    const offset = last ? last.timestamp : null;
    if (offset) {
      this.infiniteScrollingService.nextScrollBatch(this.viewport, offset, this.currentBatchParams);
    }
  }

  search(event) {
    if (event.keyCode === 13) {
      if (this.searchText !== '') {
        this.searchInternal(this.searchText);
      }
    } else if (event.keyCode || event.charCode) {
      return;
    } else {
      this.searchText = event.detail.value.trim();
    }
  }

  searchInternal(text: string) {
    this.activeTag = text;
    this.lastSearchText = text;
    if (this.lastSearchText.length > 0) {
      this.preLastSearchText = 'for';
    } else {
      this.preLastSearchText = '';
    }
    const batchParams = this.getDefaultBatchParams();
    batchParams.for = 'projectsForFeedSearch';
    batchParams.search = text.toLowerCase();
    this.reloadInfiniteScroll(batchParams);
  }

  cancelSearch() {
    this.isEmptySearch = false;
    this.isActiveSearchButton = false;
    this.activeTag = '';
    if (this.currentBatchParams.for === 'projectsForFeedSearch') {
      const batchParams = this.getDefaultBatchParams();
      this.reloadInfiniteScroll(batchParams);
    }
  }

  gotoSearchBar() {
    this.isActiveSearchButton = true;
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  projectMoreOptions(project: Project) {
    this.projectOptionsService.moreOptionsForHomePage(project);
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  trackByIndex(i) {
    return i;
  }

  ngOnDestroy() {
    if (this._feed) {
      this._feed.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
