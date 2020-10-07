import { Pipe, PipeTransform } from '@angular/core';
import memo from 'memo-decorator';

@Pipe({
  name: 'tagLabelDisplay'
})
export class TagLabelDisplayPipe implements PipeTransform {

  @memo()
  transform(label: string): any {
    return  label.slice(4, label.length);
  }

}
