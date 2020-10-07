import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ManageAllItemsComponent } from './manage-all-items.component';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [ManageAllItemsComponent],
  exports: [ManageAllItemsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ManageAllItemsComponent
  ]
})
export class ManageAllItemsModule { }
