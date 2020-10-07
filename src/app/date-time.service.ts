import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DateTimeService {

  public weekStartAt = 0; // 0 - sunday, 1 - monday
  public WEEK_IN_MINUTES = 1440 * 7;
  public dayInMilli = 1000 * 60 * 60 * 24;
  days = {
    short: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    semiShort: ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'],
    med: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    long: ['Sunday', 'Monday', 'Tuesday', 'Wednsday', 'Thursday', 'Friday', 'Saturday']
  };
  months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  timePickerEvents = new BehaviorSubject(null);
  timePickerEvents$ = this.timePickerEvents.asObservable();

  constructor() { }

  getDayTimeStringFromSec(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hoursStr = hours < 10 ? `0${hours}` : hours;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
  }

  getStartOfDayInMilli(dateInMilli: number = new Date().getTime()): number {
    return new Date(dateInMilli).setHours(0, 0, 0, 0);
  }

  getStartOfNextDayInMill(dateInMilli: number): number {
    return this.getStartOfDayInMilli(dateInMilli) + 86400000;
  }

  getEndOfDayInMilli(dateInMilli: number): number {
    return this.getStartOfNextDayInMill(dateInMilli) - 1000;
  }

  getDateAsString(dateInMilli: number, withYear = true): string {
    const dayOfWeek = this.days.med;
    const date = new Date(dateInMilli);
    const dateStr = `${dayOfWeek[date.getDay()]}, ${date.getDate()} ${this.getMonthAsString(date.getMonth())}`;
    return withYear ? `${dateStr} ${date.getFullYear()}` : dateStr;
  }

  getMonthAsString(month: number) {
    return this.months[month];
  }

  getYesterday() {
    const date = new Date();
    return date.setDate(date.getDate() - 1);
  }

  getStartOfThisWeek(): number {
    const date = new Date();
    const currentWeekDay = date.getDay();
    const lessDays = this.weekStartAt === 0 ? currentWeekDay : currentWeekDay === 0 ? 6 : currentWeekDay - 1;
    return new Date(new Date(date).setDate(date.getDate() - lessDays)).getTime();
  }

  getStartOfLastWeek(): number {
    const date = new Date(this.getStartOfThisWeek());
    return date.setDate(date.getDate() - 7);
  }

  getStartOfThisMonth(): number {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  }

  getStartOfLastMonth(): number {
    const date = new Date();
    date.setDate(1);
    return date.setMonth(date.getMonth() - 1);
  }

  getStartOfThisYear(): number {
    const date = new Date().getTime();
    return this.getStartOfYear(date);
  }

  getStartOfLastYear(): number {
    const date = new Date();
    const dateInMilli = date.setFullYear(date.getFullYear() - 1);
    return this.getStartOfYear(dateInMilli);
  }

  getStartOfYear(dateInMilli: number) {
    const date = new Date(dateInMilli);
    return new Date(date.getFullYear(), 0, 1).getTime();
  }

  getDaysInMonth(dateInMilli: number): number {
    const date = new Date(dateInMilli);
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  }

  getStartOfNextMonth(dateInMilli: number): number {
    const date = new Date(dateInMilli);
    return new Date(date.getFullYear(), date.getMonth() + 1, 1).getTime();
  }
}
