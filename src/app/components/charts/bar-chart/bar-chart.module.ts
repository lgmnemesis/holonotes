import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarChartComponent } from './bar-chart.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [BarChartComponent],
  exports: [BarChartComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    BarChartComponent
  ]
})
export class BarChartModule { }
