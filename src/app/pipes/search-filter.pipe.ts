import { Pipe, PipeTransform } from '@angular/core';
import { SortBy } from '../enums/sort-by';

@Pipe({
  name: 'searchFilter'
})
export class SearchFilterPipe implements PipeTransform {

  transform(arr: any[], searchString: string, filterBy?: SortBy): any {

    if (!arr) {
      return [];
    }

    if (searchString) {
      searchString = searchString.toLowerCase();
    }

    arr = arr.filter(el => !searchString ? true :
      el.name.toLowerCase().includes(searchString) ||
      el.artist && el.artist.toLowerCase().includes(searchString));

    if (filterBy === SortBy.Title) {
      return arr.sort((a, b) => {
        a = a.name.toLowerCase();
        b = b.name.toLowerCase();
        return a > b ? 1 : b > a ? -1 : 0;
      });
    } else if (filterBy === SortBy.Artist) {
      return arr.sort((a, b) => {
        a = a.artist ? a.artist.toLowerCase() : 'zzzzzzzzzzzzzzzzzz';
        b = b.artist ? b.artist.toLowerCase() : 'zzzzzzzzzzzzzzzzzz';
        return a > b ? 1 : b > a ? -1 : 0;
      });
    } else if (filterBy === SortBy.Date) {
      return arr.sort((a, b) => {
        a = a.timestamp;
        b = b.timestamp;
        return a > b ? 1 : b > a ? -1 : 0;
      });
    }
    return arr;
  }

}
