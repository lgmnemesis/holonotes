import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelcomeViewComponent } from './welcome-view.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [WelcomeViewComponent],
  exports: [WelcomeViewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    WelcomeViewComponent
  ]
})
export class WelcomeViewModule { }
