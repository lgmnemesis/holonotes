import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'loopColor'
})
export class LoopColorPipe implements PipeTransform {

  transform(isLoopOn: boolean): any {
    return isLoopOn ? 'medium' : 'tertiary';
  }

}
