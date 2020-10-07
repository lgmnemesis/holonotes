import { Component, OnInit, ViewChild, AfterViewInit, ElementRef, Input, ChangeDetectionStrategy } from '@angular/core';
import { Chart } from 'chart.js';
import { BarChartType } from '../../../interfaces/journy-history';

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarChartComponent implements OnInit, AfterViewInit {

  @Input()
  set chartData(chartData: any) {
    this.data = chartData;
    this.updateChart();
  }
  @Input()
  set chartType(chartType: BarChartType) {
    this.type = chartType.type;
    this.width = chartType.width;
    this.height = chartType.height;
    if (this.afterViewInitDone) {
      this.createChart();
    }
  }

  @ViewChild('container', {static: false}) containerEl: ElementRef;
  @ViewChild('chart', {static: false}) chartEl: ElementRef;

  chart: Chart;
  data: any;
  type: string;
  width: string;
  height: string;
  afterViewInitDone = false;

  constructor() { }

  ngOnInit() {
  }

  ngAfterViewInit() {
    this.createChart();
    this.afterViewInitDone = true;
  }

  createChart() {
    try {
      const el = this.containerEl.nativeElement;
      if (this.width) {
        el.style.setProperty('--width', this.width);
      }
      if (this.height) {
        el.style.setProperty('--height', this.height);
      }

      if (!this.data) {
        console.error('can not drow chart. data is missing');
        return;
      }
      if (this.chart) {
        this.chart.destroy();
      }
      this.chart = new Chart(this.chartEl.nativeElement, {
        type: this.type,
        data: this.data.data,
        options: this.data.options
      });
    } catch (error) {
     console.error(error);
    }
  }

  updateChart() {
    if (!this.afterViewInitDone) {
      return;
    }
    try {
      this.chart.data = this.data.data;
      this.data.options = this.data.options;
      this.chart.update();
    } catch (error) {
      console.error(error);
    }
  }
}
