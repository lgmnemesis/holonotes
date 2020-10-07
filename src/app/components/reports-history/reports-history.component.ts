import { Component, OnInit, Input } from '@angular/core';
import { Journey } from '../../interfaces/journy-history';
import { DateTimeService } from '../../date-time.service';

@Component({
  selector: 'app-reports-history',
  templateUrl: './reports-history.component.html',
  styleUrls: ['./reports-history.component.scss'],
})
export class ReportsHistoryComponent implements OnInit {

  @Input()
  set journeyList(journeyList: Journey[]) {
    this.sortList(journeyList);
  }

  list: {name: string, displayTime: string, time: number}[] = [];
  listSortedByName: {name: string, displayTime: string, time: number}[] = [];
  totalTime = '';
  isSortNameDown = false;
  isSortTimeDown = false;
  isSortNameActive = true;

  constructor(private dateTimeService: DateTimeService) { }

  ngOnInit() {
  }

  sortList(journeyList: Journey[]) {
    let total = 0;
    this.list = [];
    const obj = {};
    let noDescEntryTime = -1;
    journeyList.forEach(journey => {
      total += journey.end_time - journey.start_time;
      const time = Math.floor((journey.end_time - journey.start_time) / 1000);
      obj[journey.name] = obj[journey.name] === undefined ? time : obj[journey.name] + time;
    });
    const entries: [string, number][] = Object.entries(obj);
    for (const [name, time] of entries) {
      if (!name) {
        noDescEntryTime = time;
      } else {
        const display = this.dateTimeService.getDayTimeStringFromSec(time);
        this.list.push({name: name, displayTime: display, time: time});
      }
    }
    this.list.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
    if (noDescEntryTime > -1) {
      const display = this.dateTimeService.getDayTimeStringFromSec(noDescEntryTime);
      this.list.push({name: '', displayTime: display, time: noDescEntryTime});
    }
    const totalSeconds = Math.floor(total / 1000);
    this.totalTime = this.dateTimeService.getDayTimeStringFromSec(totalSeconds);
    this.listSortedByName = JSON.parse(JSON.stringify(this.list));
    this.isSortNameDown = false;
    this.isSortTimeDown = false;
    this.isSortNameActive = true;
  }

  sortListByName() {
    this.list = JSON.parse(JSON.stringify(this.listSortedByName));
  }

  sortListByTime() {
    this.list = JSON.parse(JSON.stringify(this.listSortedByName));
    this.list.sort((a, b) => (a.time > b.time) ? 1 : ((b.time > a.time) ? -1 : 0));
  }

  toggleSortByName() {
    this.sortListByName();
    if (!this.isSortNameDown) {
      this.list.sort((a, b) => (b.name > a.name) ? 1 : ((a.name > b.name) ? -1 : 0));
    }
    this.isSortNameDown = !this.isSortNameDown;
    this.isSortTimeDown = false;
    this.isSortNameActive = true;
  }

  toggleSortByTime() {
    this.sortListByTime();
    if (this.isSortTimeDown) {
      this.list.sort((a, b) => (b.time > a.time) ? 1 : ((a.time > b.time) ? -1 : 0));
    }
    this.isSortTimeDown = !this.isSortTimeDown;
    this.isSortNameDown = true;
    this.isSortNameActive = false;
  }
}
