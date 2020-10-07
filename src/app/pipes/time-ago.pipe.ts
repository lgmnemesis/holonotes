import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'timeAgo'
})
export class TimeAgoPipe implements PipeTransform {

  transform(time: number): any {

    if (!time || time < 0) {
      return '';
    }
    const now = new Date().getTime();
    const t = now - time;
    if (t < 60 * 60 * 1000) {
      const min = Math.floor(t / 60 / 1000);
      const inMin = min <= 0 ? 1 : min;
      return inMin > 1 ? `${inMin} minutes ago` : `${inMin} minute ago`;
    } else if (t < 60 * 60 * 1000 * 24) {
      const inHours = Math.floor(t / 60 / 60 / 1000);
      return inHours > 1 ? `${inHours} hours ago` : `${inHours} hour ago`;
    } else {
      const inDays = Math.floor(t / 60 / 60 / 1000 / 24);
      return inDays > 1 ? `${inDays} days ago` : `${inDays} day ago`;
    }
  }

}
