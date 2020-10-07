import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SignInComponent } from './sign-in.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SignInComponent],
  exports: [SignInComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SignInComponent
  ]
})
export class SignInModule { }
