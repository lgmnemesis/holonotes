import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimePickerComponent } from './time-picker.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [TimePickerComponent],
  exports: [TimePickerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TimePickerComponent
  ]
})
export class TimePickerModule { }
