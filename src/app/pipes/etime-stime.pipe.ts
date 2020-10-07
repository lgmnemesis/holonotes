import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'eTimeStime'
})
export class EtimeStimePipe implements PipeTransform {

  @memo()
  transform(startTime: number, endTime: number): any {
    if (startTime <= 0 || endTime <= 0) {
      return null;
    }
    const total = endTime - startTime;
    let totalSeconds = Math.floor(total / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hoursStr = hours < 10 ? `0${hours}` : hours;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

}
