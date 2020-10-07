import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';
import { Task } from '../interfaces/task';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'taskDisplayTime'
})
export class TaskDisplayTimePipe implements PipeTransform {

  daysArray = [];

  @memo()
  transform(task: Task, day: number = 0, daysArray: string[] = null): any {
    this.daysArray = daysArray;
    return this.calcTime(task, day);
  }

  calcTime(task: Task, day: number): string {
    if (!task) {
      return '';
    }
    let timeStr = '';
    const timeInMinutes = task.timeInMinutes;
    const daysAHead = timeInMinutes < 1440 ? 0 : Math.floor(timeInMinutes / 1440);
    const numOfHoursInMins = timeInMinutes - (daysAHead * 1440) ;
    const hours = numOfHoursInMins === 0 ? 0 : Math.floor(numOfHoursInMins / 60);
    const mins = timeInMinutes - (daysAHead * 1440) - (hours * 60);

    const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
    const minsStr = mins < 10 ? `0${mins}` : `${mins}`;
    timeStr = `${hoursStr}:${minsStr}`;

    if (task.alarms.length === 0) {
      timeStr = 'No alarm set';
    } else if (daysAHead === 7) {
      timeStr = 'No days selected';
    } else if (daysAHead > 0) {
      const findDay = day + daysAHead;
      let nextDay = findDay;
      if (findDay > 6) {
        nextDay = findDay - 7;
      }
      const nextText = daysAHead === 1 ? 'Tommorow, ' : findDay > 6 ? 'Next ' : '';

      if (this.daysArray && this.daysArray.length >= nextDay - 1) {
        timeStr = `${nextText}${this.daysArray[nextDay]} at ${timeStr}`;
      }
    }
    return timeStr;
  }
}
