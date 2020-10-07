import { Injectable, NgZone } from '@angular/core';
import { environment } from '../../environments/environment';
import { BehaviorSubject, Observable, Subscription, timer } from 'rxjs';
import { DatabaseService } from './database.service';

declare var RSSParser;

@Injectable({
  providedIn: 'root'
})
export class NewsFeedService {

  private TIMER = 180000;
  private MAX_FEEDS = 500;
  private CORS_PROXY = environment.production ? '/n-feed?id=' : 'https://cors-anywhere.herokuapp.com/';
  private isLoadAllFeeds = false;
  private isRegisteredToFeedsConfiguration = false;
  private feedsSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  private feeds$ = this.feedsSubject.asObservable();
  private canUpdateFeedsSubject: BehaviorSubject<any> = new BehaviorSubject(null);
  private canUpdateFeeds$ = this.canUpdateFeedsSubject.asObservable();
  private _feedConfig: Subscription;
  private feeds = null;
  private feedsUrls = null;
  private isCheckingForUpdate = false;

  constructor(private dataBaseService: DatabaseService,
    private ngZone: NgZone) {
    try {
      this.ngZone.runOutsideAngular(() => {
        const source = timer(this.TIMER, this.TIMER);
        source.subscribe(() => {
          this.checkAndUpdateFeeds();
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  init() {
    this.feedsSubject.next(this.feeds);
    this.registerToFeedConfiguration();
  }

  getFeedsAsObservable(): Observable<any> {
    return this.feeds$;
  }

  getCanUpdateFeedsAsObservable(): Observable<any> {
    return this.canUpdateFeeds$;
  }

  private registerToFeedConfiguration() {
    if (!this.isRegisteredToFeedsConfiguration) {
      this.isRegisteredToFeedsConfiguration = true;
      if (this._feedConfig) {
        this._feedConfig.unsubscribe();
      }
      this._feedConfig = this.dataBaseService.getNewsFeedConfigurationAsObservable().subscribe((config) => {
        if (config && config.feeds) {
          this.feedsUrls = config.feeds;
          this.loadAllFeeds(this.feedsUrls);
        }
      });
    }
  }

  private loadAllFeeds(urls: string[]) {
    if (this.isLoadAllFeeds) {
      return;
    }
    this.isLoadAllFeeds = true;

    this.feeds = [];
    urls.forEach(url => {
      this.loadFeed(url).then((feed) => {
        const f = this.mergeFeeds(this.feeds, feed);
        if (f && f.length > this.feeds.length) {
          this.feeds = this.getSortedFeeds(f);
          this.feedsSubject.next(this.feeds);
        }
      });
    });
  }

  private mergeFeeds(feeds: any[], feed): any[] {
    const items = feed ? feed.items : null;
    const feedsCopy = JSON.parse(JSON.stringify(feeds));
    if (items && items.length > 0) {
      items.forEach(item => {
        const thumbnail = item && item.thumbnail && item.thumbnail.$ && item.thumbnail.$.url ? item.thumbnail.$.url : null;
        const d = item.pubDate ? new Date(item.pubDate).getTime() : -1;
        const it = {id: this.dataBaseService.createId(), date: d, item: item};
        if (item
          && ((item.enclosure
          && item.enclosure.type
          && item.enclosure.type === 'image/jpeg'
          && item.enclosure.url) || thumbnail)
          && item.link) {
          if (item.enclosure && item.enclosure.url) {
            item.enclosure.url = this.httpToHttps(item.enclosure.url);
          } else if (thumbnail) {
            item.thumbnail.$.url = this.httpToHttps(item.thumbnail.$.url);
          }
          item.link = this.httpToHttps(item.link);
          feedsCopy.push(it);
        }
      });
      return feedsCopy;
    }
  }

  private httpToHttps(url: string) {
    return url.replace('http://', 'https://');
  }

  private getSortedFeeds(feeds) {
    const sorted = feeds ? feeds.sort((a, b) => {
      return a.date < b.date ? 1 : -1;
    }) : [];
    const json = JSON.parse(JSON.stringify(sorted.slice(0, this.MAX_FEEDS)));
    return json;
  }

  private checkAndUpdateFeeds() {
    this.isCheckingForUpdate = true;
    const urls = this.feedsUrls;
    const all = [];
    urls.forEach(url => {
      const p = this.loadFeed(url);
      all.push(p);
    });

    Promise.all(all)
    .then((feeds) => {
      this.isCheckingForUpdate = false;
      const newFeeds = this.updateFeeds(feeds);
      if (newFeeds && newFeeds[0] && this.feeds && this.feeds[0]) {
        if (newFeeds[0].date > this.feeds[0].date) {
          this.canUpdateFeedsSubject.next(newFeeds);
          this.feeds = newFeeds;
        }
      }
    })
    .catch((error) => {
      this.isCheckingForUpdate = false;
      console.error(error);
    });
  }

  updateFeeds(feeds: any[]): any[] {
    if (feeds && feeds.length > 0) {
      let all = [];
      feeds.forEach(feed => {
        all = this.mergeFeeds(all, feed);
      });
      return this.getSortedFeeds(all);
    }
  }

  resetCanUpdateFeeds() {
    this.canUpdateFeedsSubject.next(null);
  }

  private loadFeed(feedUrl: string): Promise<any> {
    try {
      const parser = new RSSParser({
        customFields: {
          item: [['media:thumbnail', 'thumbnail'], 'subtitle'],
          timeout: 20000,
        }
      });
      return parser.parseURL(this.CORS_PROXY + feedUrl)
      .catch(error => console.error(feedUrl, error));
    } catch (error) {
      console.error(error);
      return new Promise((resolve, reject) => {
        reject(error);
      });
    }
  }
}
