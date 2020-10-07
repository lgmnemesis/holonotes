import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditBookmarkComponent } from './edit-bookmark.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [EditBookmarkComponent],
  exports: [EditBookmarkComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    EditBookmarkComponent
  ]
})
export class EditBookmarkModule { }
