import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';
import { TasksService } from '../services/tasks.service';
import { Challenge } from '../interfaces/task';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'challengeTimeLeft'
})
export class ChallengeTimeLeftPipe implements PipeTransform {

  constructor(private tasksService: TasksService) { }

  @memo()
  transform(challenge: Challenge): any {
    return challenge ? this.tasksService.challengeTimeLeft(challenge) : '';
  }

}
