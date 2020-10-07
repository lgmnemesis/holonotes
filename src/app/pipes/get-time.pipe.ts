import { Pipe, PipeTransform } from '@angular/core';
import { Timeline } from '../interfaces/timeline';
import { VideoService } from '../services/video.service';
import memo from 'memo-decorator';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'getTime'
})
export class GetTimePipe implements PipeTransform {

  constructor(private videoService: VideoService) { }

  @memo()
  transform(timeline: Timeline, isBothViews?: boolean): any {
    let startTime, endTime, viewName;
    if (timeline.lesson_isActivePlayer) {
      startTime = timeline.lesson_start_at;
      endTime = timeline.lesson_end_at;
      viewName = 'Lesson View';
    } else {
      startTime = timeline.source_start_at;
      endTime = timeline.source_end_at;
      viewName = 'Song View';
    }
    const start = this.videoService.getTimeToDisplayBySeconds(startTime);
    if (!isBothViews) {
      return start;
    }
    const end = this.videoService.getTimeToDisplayBySeconds(endTime);
    return  `${viewName}: ${start} - ${end}`;
  }

}
