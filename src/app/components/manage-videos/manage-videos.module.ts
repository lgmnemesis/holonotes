import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManageVideosComponent } from './manage-videos.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [ManageVideosComponent],
  exports: [ManageVideosComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ManageVideosComponent
  ]
})
export class ManageVideosModule { }
