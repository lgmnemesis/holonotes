import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';

/** Adding the dynamic decorator to supress the following error when build --prod:
 *  Metadata collected contains an error that will be reported at runtime: Lambda not supported
 * @dynamic
 */
@Pipe({
  name: 'toolbarTabColor'
})
export class ToolbarTabColorPipe implements PipeTransform {

  @memo()
  transform(clickedUrl: any, url: string): any {
    return url.match(`^${clickedUrl}[#]*`) ? 'primary' : 'dark';
  }

}
