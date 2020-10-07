import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupportUsComponent } from './support-us.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SupportUsComponent],
  exports: [SupportUsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SupportUsComponent
  ]
})
export class SupportUsModule { }
