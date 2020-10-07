import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialSharingPopoverComponent } from './social-sharing-popover.component';
import { SocialSharingModule } from '../social-sharing/social-sharing.module';

@NgModule({
  imports: [CommonModule, FormsModule, SocialSharingModule],
  declarations: [SocialSharingPopoverComponent],
  exports: [SocialSharingPopoverComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SocialSharingPopoverComponent
  ]
})
export class SocialSharingPopoverModule { }
