import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideosComponent } from './videos.component';
import { VideosMoreModule } from '../videos-more/videos-more.module';

@NgModule({
  imports: [CommonModule, FormsModule, VideosMoreModule],
  declarations: [VideosComponent],
  exports: [VideosComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    VideosComponent
  ]
})
export class VideosModule { }
