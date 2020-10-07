import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JourneyHistoryComponent } from './journey-history.component';
import { StartEndTimepickerModule } from '../start-end-timepicker/start-end-timepicker.module';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, StartEndTimepickerModule, Pipes],
  declarations: [JourneyHistoryComponent],
  exports: [JourneyHistoryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    JourneyHistoryComponent
  ]
})
export class JourneyHistoryModule { }
