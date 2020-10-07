import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskCategoriesComponent } from './task-categories.component';
import { Pipes } from '../../../pipes/pipes.module';
import { CategoryModule } from '../category/category.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes, CategoryModule],
  declarations: [TaskCategoriesComponent],
  exports: [TaskCategoriesComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TaskCategoriesComponent
  ]
})
export class TaskCategoriesModule { }
