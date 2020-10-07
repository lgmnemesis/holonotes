import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedSliderComponent } from './feed-slider.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [FeedSliderComponent],
  exports: [FeedSliderComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    FeedSliderComponent
  ]
})
export class FeedSliderModule { }
