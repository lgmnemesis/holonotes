import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StartEndTimepickerComponent } from './start-end-timepicker.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [StartEndTimepickerComponent],
  exports: [StartEndTimepickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    StartEndTimepickerComponent
  ]
})
export class StartEndTimepickerModule { }
