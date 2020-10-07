import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationsCenterComponent } from './notifications-center.component';
import { TaskDetailsModule } from '../motivation/task-details/task-details.module';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, TaskDetailsModule, Pipes],
  declarations: [NotificationsCenterComponent],
  exports: [NotificationsCenterComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    NotificationsCenterComponent
  ]
})
export class NotificationsCenterModule { }
