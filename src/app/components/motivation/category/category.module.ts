import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryComponent } from './category.component';
import { Pipes } from '../../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [CategoryComponent],
  exports: [CategoryComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    CategoryComponent
  ]
})
export class CategoryModule { }
