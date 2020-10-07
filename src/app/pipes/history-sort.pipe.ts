import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';
import { Journey } from '../interfaces/journy-history';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'historySort'
})
export class HistorySortPipe implements PipeTransform {

  @memo()
  transform(list: Journey[]): any {
    if (!list) {
      return null;
    }
    const sorted: Map<number, Journey[]> = new Map();
    list.map((journey) => {
      const startDay = new Date(journey.start_time).setHours(0, 0, 0, 0);
      if (!sorted.get(startDay)) {
        sorted.set(startDay, []);
      }
      sorted.get(startDay).push(journey);
    });
    const keys = Array.from(sorted.keys()).sort((a, b) => b - a);
    const sortByKey = [];
    keys.forEach(key => {
      const sortedArr = sorted.get(key).sort((a, b) => b.start_time - a.start_time);
      sortByKey.push(sortedArr);
    });
    return sortByKey;
  }

}
