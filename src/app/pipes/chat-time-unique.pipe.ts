import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'chatTimeUnique'
})
export class ChatTimeUnique implements PipeTransform {

  transform(time: number, obj): any {
    const t = new Date(time);
    const str = `${t.getDate()}${t.getMonth()}${t.getFullYear()}`;
    const show = !(obj[str] === 'true');
    obj[str] = 'true';
    return show;
  }

}
