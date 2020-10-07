import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VideosMoreComponent } from './videos-more.component';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [VideosMoreComponent],
  exports: [VideosMoreComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    VideosMoreComponent
  ]
})
export class VideosMoreModule { }
