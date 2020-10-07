import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideoPlayerButtonsComponent } from './video-player-buttons.component';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [VideoPlayerButtonsComponent],
  exports: [VideoPlayerButtonsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class VideoPlayerButtonsModule { }
