import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProgressBarCircleComponent } from './progress-bar-circle.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [ProgressBarCircleComponent],
  exports: [ProgressBarCircleComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ProgressBarCircleComponent
  ]
})
export class ProgressBarCircleModule { }
