import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { NewsFeedService } from '../../services/news-feed.service';
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';
import { translateYDownSlow } from '../../models/animations';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-news-feed',
  templateUrl: './news-feed.page.html',
  styleUrls: ['./news-feed.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    translateYDownSlow
  ]
})
export class NewsFeedPage implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('content', {static: false}) private content: any;

  feeds = null;
  canUpdateFeeds = false;
  updatedFeeds = null;
  paginationCounter = 1;
  paginationSize = 30;
  onlyOnce = false;
  isLoading = false;
  _feeds: Subscription;
  _canUpdateFeeds: Subscription;


  constructor(private newsFeedService: NewsFeedService,
    private sharedService: SharedService,
    private cd: ChangeDetectorRef,
    private loadingCtrl: LoadingController) { }

  ngOnInit() {
    this.newsFeedService.init();

    this._feeds = this.newsFeedService.getFeedsAsObservable().subscribe((feeds) => {
      if (feeds) {
        this.feeds = feeds;
        this.resetCanUpdateFeeds();
        this.unloadSpinner();
        this.markForCheck();
      } else {
        this.presentLoading();
      }
    });

    this._canUpdateFeeds = this.newsFeedService.getCanUpdateFeedsAsObservable().subscribe((feeds) => {
      if (feeds) {
        this.canUpdateFeeds = true;
        this.updatedFeeds = feeds;
        this.markForCheck();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#news-feed-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  unloadSpinner() {
    if (this.isLoading) {
      this.isLoading = false;
      setTimeout(() => {
        this.sharedService.unloadSpinner();
      }, 3000);
    }
  }

  async presentLoading(message: string = 'Loading News...') {
    if (this.onlyOnce) {
      return null;
    }
    this.onlyOnce = true;
    this.isLoading = true;
    this.sharedService.loadingSpinner = await this.loadingCtrl.create({
      spinner: 'bubbles',
      message: message,
      mode: 'ios',
      translucent: true
    });
    setTimeout(() => {
      this.unloadSpinner();
    }, 10000);
    this.sharedService.loadingSpinnerSubject.next(true);
    return await this.sharedService.loadingSpinner.present();
  }

  scrollToTop(time = 0) {
    try {
      this.content.scrollToTop(time);
    } catch (error) {
      console.error(error);
    }
  }

  updatePaginationData(event) {
    event.target.complete();
    if (this.paginationCounter * this.paginationSize >= this.feeds.length) {
      event.target.disabled = true;
    } else {
      this.paginationCounter++;
    }
    this.markForCheck();
  }

  updateFeedsButton() {
    if (this.canUpdateFeeds && this.updatedFeeds && this.updatedFeeds.length > 0) {
      this.feeds = this.updatedFeeds;
      this.resetCanUpdateFeeds();
      this.markForCheck();
    }
  }

  resetCanUpdateFeeds() {
    this.canUpdateFeeds = false;
    this.newsFeedService.resetCanUpdateFeeds();
  }

  gotoFeed(feed) {
    if (feed && feed.item && feed.item.link) {
      this.openNewTab(feed.item.link);
    }
  }

  openNewTab(url: string, params = '') {
    try {
      window.open(url, '', params);
    } catch (error) {
      console.error(error);
    }
  }

  trackById(i, item) {
    return item.id;
  }

  ngOnDestroy() {
    this.newsFeedService.resetCanUpdateFeeds();
    if (this._feeds) {
      this._feeds.unsubscribe();
    }
    if (this._canUpdateFeeds) {
      this._canUpdateFeeds.unsubscribe();
    }
  }
}
