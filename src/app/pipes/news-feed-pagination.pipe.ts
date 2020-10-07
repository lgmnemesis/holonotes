import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'newsFeedPagination'
})
export class NewsFeedPaginationPipe implements PipeTransform {

  PAGINATION_BATCH_SIZE = 50;

  transform(feeds: any[], counter: number, size = this.PAGINATION_BATCH_SIZE): any {

    if (!feeds) {
      return null;
    }

    const max = counter * size;
    return max < feeds.length ? feeds.slice(0, max) : feeds;
  }

}
