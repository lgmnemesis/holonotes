import { Injectable, NgZone } from '@angular/core';
import { timer, Subscription, BehaviorSubject, Observable } from 'rxjs';
import { DatabaseService } from './database.service';
import { History, Journey, Report, ReportTimePicker, JourneyInputEvent } from '../interfaces/journy-history';
import { TaskStarted } from '../interfaces/task';
import { ReportsService } from './reports.service';
import { DateTimeService } from '../date-time.service';

@Injectable({
  providedIn: 'root'
})
export class JourneyService {

  public currentJourney: Journey = this.createJourney();
  private history: History = null;
  private journeyMapSorted: Map<number, Journey[]> = new Map();
  private isResisteredToHistory = false;
  private _timer: Subscription;
  private timeTrackerSub: BehaviorSubject<{id: string, counter: number}> = new BehaviorSubject({id: null, counter: -1});
  private timeTracker$: Observable<{id: string, counter: number}> = this.timeTrackerSub.asObservable();
  private historySubject: BehaviorSubject<History> = new BehaviorSubject(null);
  private history$: Observable<History> = this.historySubject.asObservable();

  timerCounter = '00:00:00';
  timeTracker = 0;
  isTimerStarted = false;

  constructor(private ngZone: NgZone,
    private databaseService: DatabaseService,
    private reportsService: ReportsService,
    private dateTimeService: DateTimeService) { }

  private startTimer(id: string) {
    try {
      this.stopTimer(id);

      let counter = 0;
      this.ngZone.runOutsideAngular(() => {
        const source = timer(0, 1000);
        this._timer = source.subscribe(() => {
          this.timeTrackerSub.next({id: id, counter: counter});
          counter++;
        });
      });
    } catch (error) {
      console.error(error);
    }
  }

  private stopTimer(id: string) {
    this.timeTrackerSub.next({id: id, counter: -1});
    if (this._timer) {
      this._timer.unsubscribe();
    }
  }

  getTimeTrackerAsObservable(): Observable<{id: string, counter: number}> {
    return this.timeTracker$;
  }

  registerToHistory() {
    if (this.isResisteredToHistory) {
      return;
    }
    this.databaseService.getUserHistoryAsObservable().subscribe((history) => {
      this.historySubject.next(history);
      this.history = history;
      this.isResisteredToHistory = true;
      this.sortJourneyMap();
    });
  }

  sortJourneyMap() {
    const list = this.getJourneyList();
    const sorted: Map<number, Journey[]> = new Map();
    list.map((journey) => {
      const startDay = this.dateTimeService.getStartOfDayInMilli(journey.start_time);
      if (!sorted.get(startDay)) {
        sorted.set(startDay, []);
      }
      sorted.get(startDay).push(journey);
    });
    const keys = Array.from(sorted.keys()).sort((a, b) => b - a);
    keys.forEach(key => {
      sorted.get(key).sort((a, b) => b.start_time - a.start_time);
    });
    this.journeyMapSorted = sorted;
  }

  getListForReport(timeSelected: ReportTimePicker): Report {
    switch (timeSelected.picker) {
      case 'today':
        return this.reportsService.getTodayReport(this.journeyMapSorted);
      case 'yesterday':
        return this.reportsService.getYesterdayReport(this.journeyMapSorted);
      case 'this week':
        return this.reportsService.getThisWeekReport(this.journeyMapSorted);
      case 'last week':
        return this.reportsService.getLastWeekReport(this.journeyMapSorted);
      case 'this month':
        return this.reportsService.getThisMonthReport(this.journeyMapSorted);
      case 'last month':
        return this.reportsService.getLastMonthReport(this.journeyMapSorted);
      case 'this year':
        return this.reportsService.getThisYearReport(this.journeyMapSorted);
      case 'last year':
        return this.reportsService.getLastYearReport(this.journeyMapSorted);
      default:
        break;
    }
  }

  getJourneyList(): Journey[] {
    return this.history && this.history.journey_list ? JSON.parse(JSON.stringify(this.history.journey_list)) : [];
  }

  getHistoryAsObservable(): Observable<History> {
    return this.history$;
  }

  updateHistory(history: History) {
    this.databaseService.updateUserHistory(history)
    .catch((error) => {
      console.error(error);
    });
  }

  createJourney(): Journey {
    return {
      id: this.databaseService.createId(),
      name: '',
      start_time: -1,
      end_time: -1
    };
  }

  updateJourneyInHistory(journey: Journey, isDelete: boolean): History {
    delete journey.is_selected;
    const filterd = this.history.journey_list.filter(j => j.id !== journey.id);
    if (!isDelete) {
      filterd.push(journey);
    }
    this.history.journey_list = filterd;
    return this.history;
  }

  getUpdatedJourney(journey: Journey): History {
    delete journey.is_selected;
    let history: History = null;
    journey.id = journey.id || this.databaseService.createId();
    if (this.history) {
      this.history.journey_list.push(journey);
      history = this.history;
    } else {
      const list = [];
      list.push(journey);
      history = {
        user_id: this.databaseService.getMyUserId(),
        journey_list: list
      };
    }
    return history;
  }

  addJourneyToHistory(journey: Journey) {
    if (!this.isResisteredToHistory) {
      return;
    }
    const history = this.getUpdatedJourney(journey);
    this.updateHistory(history);
  }

  createJourneyFromTask(task: TaskStarted): Journey {
    const journey = this.createJourney();
    journey.name = task.task.name;
    journey.start_time = task.startedTime;
    journey.end_time = journey.start_time + task.timePassed * 1000;
    return journey;
  }

  updateJourneyHistory(task: TaskStarted) {
    const journey = this.createJourneyFromTask(task);
    this.addJourneyToHistory(journey);
  }

  timerAction(event: JourneyInputEvent) { // start/stop/add timer
    if (event.gotoJourney) {
      // For now only used in project popover - handled there.
    } else if (event.isAddMode) {
      this.currentJourney = this.createJourney();
      this.currentJourney.name = event.name;
      this.currentJourney.start_time = event.start_time;
      this.currentJourney.end_time = event.end_time;
      this.resultAction(JSON.parse(JSON.stringify(this.currentJourney)));
      this.resetTimer();
    } else if (event.isStarted) {
      this.currentJourney = this.createJourney();
      this.currentJourney.name = event.name;
      this.currentJourney.start_time = new Date().getTime();
      this.startTimer(this.currentJourney.id);
    } else {
      if (event.isDelete) {
      } else {
        this.currentJourney.name = event.name;
        this.currentJourney.end_time = this.currentJourney.start_time + this.timeTracker * 1000;
        this.resultAction(JSON.parse(JSON.stringify(this.currentJourney)));
      }
      this.resetTimer();
      this.stopTimer(this.currentJourney.id);
    }
  }

  resetTimer() {
    this.currentJourney = {
      id: null,
      name: null,
      start_time: -1,
      end_time: -1,
      is_selected: false
    };
    this.timeTracker = 0;
    this.timerCounter = '00:00:00';
  }

  editAction(journey: Journey, isDelete: boolean) {
    if (!this.isResisteredToHistory) {
      return;
    }
    const history = this.updateJourneyInHistory(journey, isDelete);
    this.updateHistory(history);
  }

  private resultAction(journey: Journey) {
    this.addJourneyToHistory(journey);
  }
}
