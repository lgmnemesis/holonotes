import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoPlayerComponent } from './video-player.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [VideoPlayerComponent],
  exports: [VideoPlayerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VideoPlayerModule { }
