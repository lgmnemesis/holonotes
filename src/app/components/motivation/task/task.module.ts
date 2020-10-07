import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskComponent } from './task.component';
import { Pipes } from '../../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [TaskComponent],
  exports: [TaskComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TaskComponent
  ]
})
export class TaskModule { }
