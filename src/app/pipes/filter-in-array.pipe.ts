import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';
import { TasksService } from '../services/tasks.service';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'filterInArray'
})
export class FilterInArrayPipe implements PipeTransform {

  @memo()
  transform(id: string, array: any[]): any {
    return !(array && array.find(el => el.id === id));
  }

}
