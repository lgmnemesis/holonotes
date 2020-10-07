import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SideMenuComponent } from './side-menu.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [SideMenuComponent],
  exports: [SideMenuComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SideMenuComponent
  ]
})
export class SideMenuModule { }
