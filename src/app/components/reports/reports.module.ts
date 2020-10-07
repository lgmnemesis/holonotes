import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportsComponent } from './reports.component';
import { BarChartModule } from '../charts/bar-chart/bar-chart.module';
import { TimePickerModule } from '../time-picker/time-picker.module';
import { ReportsHistoryModule } from '../reports-history/reports-history.module';

@NgModule({
  imports: [CommonModule, FormsModule, BarChartModule, TimePickerModule, ReportsHistoryModule],
  declarations: [ReportsComponent],
  exports: [ReportsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ReportsComponent
  ]
})
export class ReportsModule { }
