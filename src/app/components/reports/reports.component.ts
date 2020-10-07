import { Component, OnInit, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { JourneyService } from '../../services/journey.service';
import { ReportTimePicker, Report, BarChartType } from '../../interfaces/journy-history';
import { TimePickerComponent } from '../time-picker/time-picker.component';
import { PopoverController } from '@ionic/angular';
import { DateTimeService } from '../../date-time.service';
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportsComponent implements OnInit, OnDestroy {

  list: Report = null;
  chartData: any;
  timeSelected: ReportTimePicker = { picker: 'this week' };
  useSpinner = false;
  _timePickerEvents: Subscription;
  _screenRes: Subscription;
  chartType: BarChartType;

  constructor(private journeyService: JourneyService,
    private popoverCtrl: PopoverController,
    private cd: ChangeDetectorRef,
    private dateTimeService: DateTimeService,
    private sharedService: SharedService) { }

  ngOnInit() {
    this.rebuildReport();
    this._timePickerEvents = this.dateTimeService.timePickerEvents$.subscribe((event) => {
      this.useSpinner = false;
      if (event) {
        this.useSpinner = true;
      }
      this.markForCheck();
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        if ((this.sharedService.isLessThanMediumWindowWidth() && this.chartType.type === 'bar') ||
          (!this.sharedService.isLessThanMediumWindowWidth() && this.chartType.type === 'horizontalBar')) {
          this.setChart();
          this.markForCheck();
        }
      }
    });
  }

  markForCheck() {
    this.cd.detectChanges();
  }

  rebuildReport() {
    this.list = this.journeyService.getListForReport(this.timeSelected);
    this.setChart();
    this.dateTimeService.timePickerEvents.next(null);
  }

  async presentTimePickerPopover(ev: Event) {
    const popover = await this.popoverCtrl.create({
      component: TimePickerComponent,
      componentProps: { activeButton: this.timeSelected },
      event: ev,
      translucent: false,
      mode: 'ios',
    });

    popover.onDidDismiss()
    .then((res) => {
      if (res && res.data) {
        this.timeSelected = res.data;
        this.rebuildReport();
      } else {
        this.dateTimeService.timePickerEvents.next(null);
      }
    })
    .catch((error) => {
      this.dateTimeService.timePickerEvents.next(null);
      console.error(error);
    });

    return await popover.present();
  }

  setChart() {
    let xAxes = [{
      gridLines: {
        drawOnChartArea: false
      },
      ticks: {
        autoSkip: true,
        beginAtZero: true,
        maxTicksLimit: 12,
        maxRotation: 90,
        minRotation: 0
      }
    }];

    let yAxes = [{
      display: true,
      gridLines: {
        drawOnChartArea: true,
        drawBorder: false
      },
      ticks: {
        display: false,
        beginAtZero: true,
        maxTicksLimit: 10,
        callback: function(value, index, values) {
          const num = Math.floor(Number(value) / 60 / 60);
          return `${num}`;
        }
      }
    }];

    if (this.sharedService.isLessThanMediumWindowWidth()) {
      const swapX = JSON.parse(JSON.stringify(xAxes));
      const swapY = JSON.parse(JSON.stringify(yAxes));
      yAxes = swapX;
      xAxes = swapY;
    }
    this.chartType = {
      type: this.sharedService.isLessThanMediumWindowWidth() ? 'horizontalBar' : 'bar',
      width: null,
      height: this.sharedService.isLessThanMediumWindowWidth() ? '470px' : '320px'
    };

    this.chartData = {
      data: {
      labels: this.list.labels,
      datasets: [{
        data: this.list.data,
        backgroundColor: 'rgba(0, 204, 204, 0.5)',
      }]},
      options: {
        responsive: true,
        // aspectRatio: 3,
        maintainAspectRatio: false,
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              let totalSeconds = Number(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]);
              let timerCounter = `00:00:00`;
              if (totalSeconds > 0) {
                const hours = Math.floor(totalSeconds / 3600);
                totalSeconds %= 3600;
                const minutes = Math.floor(totalSeconds / 60);
                const seconds = totalSeconds % 60;
                const hoursStr = hours < 10 ? `0${hours}` : hours;
                const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
                const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
                timerCounter = `${hoursStr}:${minutesStr}:${secondsStr}`;
              }
              return `Total: ${timerCounter}`;
            }
          }
        },
        legend: { display : false },
        scales: {
          xAxes: xAxes,
          yAxes: yAxes
        }
      }
    };
  }

  ngOnDestroy() {
    if (this._timePickerEvents) {
      this._timePickerEvents.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
  }
}
