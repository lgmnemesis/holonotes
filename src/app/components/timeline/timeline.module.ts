import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimelineComponent } from './timeline.component';
import { Pipes } from '../../pipes/pipes.module';
import { TimelineMoreModule } from '../timeline-more/timeline-more.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes, TimelineMoreModule],
  declarations: [TimelineComponent],
  exports: [TimelineComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TimelineComponent
  ]
})
export class TimelineModule { }
