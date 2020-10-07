import { Pipe, PipeTransform } from '@angular/core';
import { Timeline } from '../interfaces/timeline';
import { VideoService } from '../services/video.service';
import memo from 'memo-decorator';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'markerPosition'
})
export class MarkerPositionPipe implements PipeTransform {

  constructor(private videoService: VideoService) { }

  @memo()
  transform(timeline: Timeline, playerId: string, durationTime: number): any {
    const player = this.videoService.getPlayerById(playerId);
    const value =
      player && player.videoUrl === timeline.lesson_id
        ? timeline.lesson_start_at
        : timeline.source_start_at;
    const min = 0;
    const max = durationTime;
    const m1 = (value - min) / (max - min);
    const ratio = Math.max(0, Math.min(m1, 1));

    if (player && player.videoUrl !== timeline.source_id) {
      return { left: '-99999999px' }; // Show marker only on source video timeline
    }

    const res = (ratio * 100).toFixed(4);
    return { left: res + '%' };
  }
}
