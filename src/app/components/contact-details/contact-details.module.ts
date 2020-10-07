import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactDetailsComponent } from './contact-details.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [ContactDetailsComponent],
  exports: [ContactDetailsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ContactDetailsComponent
  ]
})
export class ContactDetailsModule { }
