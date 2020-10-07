import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { BehaviorSubject } from 'rxjs';
import { throttleTime, mergeMap, scan, map } from 'rxjs/operators';
import { BatchScroll } from '../interfaces/batchScroll';

@Injectable({
  providedIn: 'root'
})
export class InfiniteScrollingService {

  defaultOffsetTrigger = 800;
  defaultBatchSize = 40;

  constructor(private datasbaseService: DatabaseService) {
  }

  init(batchParams: BatchScroll): BatchScroll {

    const p: BatchScroll = {
      batchSize: batchParams.batchSize || this.defaultBatchSize,
      offsetTrigger: batchParams.offsetTrigger || this.defaultOffsetTrigger,
      collectionId: batchParams.collectionId,
      for: batchParams.for,
      isEnd: batchParams.isEnd || false,
      lastSeen: null,
      search: batchParams.search || null,
      infinite: null,
      offset: null,
      isLocked: false
    };

    p.offset = new BehaviorSubject(null);
    this.start(p);
    return p;
  }

  start(batchParams: BatchScroll) {
    const batchMap = batchParams.offset.pipe(
      throttleTime(500),
      mergeMap((lastSeen) => {
        batchParams.lastSeen = lastSeen;
        return this.datasbaseService.getBatchFor(batchParams);
      }),
      scan((acc, batch) => {
        return { ...acc, ...batch };
      }, {})
    );

    batchParams.infinite = batchMap.pipe(map(v => Object.values(v)));
  }

  nextScrollBatch(viewport: CdkVirtualScrollViewport, offset: any, batchParams: BatchScroll) {
    if (!batchParams || batchParams.isEnd) {
      return;
    }
    const offsetTop = viewport.measureScrollOffset();
    const offsetBottom = viewport.measureScrollOffset('bottom');

    if (offsetTop !== 0 && offsetBottom > batchParams.offsetTrigger) {
      batchParams.isLocked = false;
    }

    if (!batchParams.isLocked &&
      (offsetTop !== 0 && offsetBottom <= batchParams.offsetTrigger)) {
      batchParams.isLocked = true;
      batchParams.offset.next(offset);
    }
  }
}
