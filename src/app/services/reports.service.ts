import { Injectable } from '@angular/core';
import { Journey, Report } from '../interfaces/journy-history';
import { DateTimeService } from '../date-time.service';

@Injectable({
  providedIn: 'root'
})
export class ReportsService {

  constructor(private dateTimeService: DateTimeService) { }

  getTodayReport(journeyMap: Map<number, Journey[]>): Report {
    return this.getReport(journeyMap, this.dateTimeService.getStartOfDayInMilli(), 1);
  }

  getYesterdayReport(journeyMap: Map<number, Journey[]>): Report {
    const day = this.dateTimeService.getYesterday();
    return this.getReport(journeyMap, this.dateTimeService.getStartOfDayInMilli(day), 1);
  }

  getThisWeekReport(journeyMap: Map<number, Journey[]>): Report {
    return this.getReport(journeyMap, this.dateTimeService.getStartOfThisWeek(), 7);
  }

  getLastWeekReport(journeyMap: Map<number, Journey[]>): Report {
    return this.getReport(journeyMap, this.dateTimeService.getStartOfLastWeek(), 7);
  }

  getThisMonthReport(journeyMap: Map<number, Journey[]>): Report {
    const startTime = this.dateTimeService.getStartOfThisMonth();
    const daysInMonth = this.dateTimeService.getDaysInMonth(startTime);
    return this.getReport(journeyMap, startTime, daysInMonth);
  }

  getLastMonthReport(journeyMap: Map<number, Journey[]>): Report {
    const startTime = this.dateTimeService.getStartOfLastMonth();
    const daysInMonth = this.dateTimeService.getDaysInMonth(startTime);
    return this.getReport(journeyMap, startTime, daysInMonth);
  }

  getThisYearReport(journeyMap: Map<number, Journey[]>): Report {
    const thisYear = this.dateTimeService.getStartOfThisYear();
    return this.getYearReport(journeyMap, thisYear);
  }

  getLastYearReport(journeyMap: Map<number, Journey[]>): Report {
    const lastYear = this.dateTimeService.getStartOfLastYear();
    return this.getYearReport(journeyMap, lastYear);
  }

  getYearReport(journeyMap: Map<number, Journey[]>, startOf: number): Report {
    let startMonth = startOf;
    let totalInSec = 0;
    const list = [];
    const data: number[] = [];
    const labels: any[] = [];
    const fullYear = `${new Date(startOf).getFullYear()}`;
    for (let i = 1; i <= 12; i++) {
      const startTime = this.dateTimeService.getStartOfDayInMilli(startMonth);
      const daysInMonth = this.dateTimeService.getDaysInMonth(startTime);
      const month = this.getReport(journeyMap, startTime, daysInMonth);
      const jList = month.list || [];
      const yearLabel = [];
      yearLabel.push(this.dateTimeService.getMonthAsString(i - 1));
      yearLabel.push(fullYear);
      const jTotalInSec = month.totalInSec;
      totalInSec += jTotalInSec;
      if (jList && jList.length > 0) {
        list.push(...jList);
      }
      data.push(jTotalInSec);
      labels.push(yearLabel); // each label as an array of month and year (so chartJs will display the year in a new line)
      startMonth = this.dateTimeService.getStartOfNextMonth(startMonth);
    }
    const total = this.dateTimeService.getDayTimeStringFromSec(totalInSec);
    return {
      list: list,
      data: data,
      labels: labels,
      totalInSec: totalInSec,
      total: total
    };
  }

  getReport(journeyMap: Map<number, Journey[]>, startOf: number, numOfDays: number): Report {
    let day = startOf;
    let totalInSec = 0;
    const list = [];
    const data: number[] = [];
    const labels: string[] = [];
    for (let i = 1; i <= numOfDays; i++) {
      const startTime = this.dateTimeService.getStartOfDayInMilli(day);
      const jList = journeyMap.get(startTime) || [];
      const jTotalInSec = this.calcTotalTimeInSec(jList);
      totalInSec += jTotalInSec;
      if (jList && jList.length > 0) {
        list.push(...jList);
      }
      data.push(jTotalInSec);
      labels.push(this.dateTimeService.getDateAsString(startTime, false));
      day = this.dateTimeService.getStartOfNextDayInMill(day);
    }
    const total = this.dateTimeService.getDayTimeStringFromSec(totalInSec);
    return {
      list: list,
      data: data,
      labels: labels,
      totalInSec: totalInSec,
      total: total
    };
  }

  calcTotalTimeInSec(list: Journey[]) {
    let duration = 0;
    list.forEach(journey => {
      duration += journey.end_time - journey.start_time;
    });
    return Math.floor(duration / 1000);
  }

}
