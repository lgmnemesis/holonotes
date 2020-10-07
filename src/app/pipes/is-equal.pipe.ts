import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'isEqual'
})
export class IsEqualPipe implements PipeTransform {

  @memo()
  transform(id1: number, id2: number): any {
    return id1 === id2 ? true : false;
  }

}
