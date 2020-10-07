import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NameAndUrlComponent } from './name-and-url.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [NameAndUrlComponent],
  exports: [NameAndUrlComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    NameAndUrlComponent
  ]
})
export class NameAndUrlModule { }
