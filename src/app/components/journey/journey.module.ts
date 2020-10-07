import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JourneyComponent } from './journey.component';
import { JourneyHistoryModule } from '../journey-history/journey-history.module';
import { Pipes } from '../../pipes/pipes.module';
import { ReportsModule } from '../reports/reports.module';
import { JourneyInputContainerModule } from '../journey-input-container/journey-input-container.module';

@NgModule({
  imports: [CommonModule, FormsModule, JourneyInputContainerModule, JourneyHistoryModule, Pipes, ReportsModule],
  declarations: [JourneyComponent],
  exports: [JourneyComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    JourneyComponent
  ]
})
export class JourneyModule { }
