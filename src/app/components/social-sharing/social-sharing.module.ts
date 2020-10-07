import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialSharingComponent } from './social-sharing.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SocialSharingComponent],
  exports: [SocialSharingComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SocialSharingComponent
  ]
})
export class SocialSharingModule { }
