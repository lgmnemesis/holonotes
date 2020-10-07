import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';
import { TasksService } from '../services/tasks.service';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'minHours'
})
export class MinHoursPipe implements PipeTransform {

  constructor(private tasksService: TasksService) { }

  @memo()
  transform(time: string): any {
    const minutes = this.tasksService.getDurationInMinutes(time);
    return this.tasksService.hoursAndMinutes(minutes);
  }

}
