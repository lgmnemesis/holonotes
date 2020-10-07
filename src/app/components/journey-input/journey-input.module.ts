import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JourneyInputComponent } from './journey-input.component';
import { StartEndTimepickerModule } from '../start-end-timepicker/start-end-timepicker.module';

@NgModule({
  imports: [CommonModule, FormsModule, StartEndTimepickerModule],
  declarations: [JourneyInputComponent],
  exports: [JourneyInputComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    JourneyInputComponent
  ]
})
export class JourneyInputModule { }
