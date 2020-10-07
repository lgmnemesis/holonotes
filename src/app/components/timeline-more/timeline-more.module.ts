import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineMoreComponent } from './timeline-more.component';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [TimelineMoreComponent],
  exports: [TimelineMoreComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TimelineMoreComponent
  ]
})
export class TimelineMoreModule { }
