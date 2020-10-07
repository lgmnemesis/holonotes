import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfileComponent } from './user-profile.component';


@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [UserProfileComponent],
  exports: [UserProfileComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    UserProfileComponent
  ]
})
export class UserProfileModule { }
