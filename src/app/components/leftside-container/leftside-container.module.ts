import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LeftsideContainerComponent } from './leftside-container.component';
import { TimelineModule } from '../timeline/timeline.module';
import { VideosModule } from '../videos/videos.module';

@NgModule({
  imports: [CommonModule, FormsModule, TimelineModule, VideosModule],
  declarations: [LeftsideContainerComponent],
  exports: [LeftsideContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    LeftsideContainerComponent
  ]
})
export class LeftsideContainerModule { }
