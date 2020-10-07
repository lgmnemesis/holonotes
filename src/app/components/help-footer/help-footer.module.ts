import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HelpFooterComponent } from './help-footer.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [HelpFooterComponent],
  exports: [HelpFooterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    HelpFooterComponent
  ]
})
export class HelpFooterModule { }
