import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlarmIndicationComponent } from './alarm-indication.component';
import { TaskDetailsModule } from '../task-details/task-details.module';
import { NotificationsCenterModule } from '../../notifications-center/notifications-center.module';


@NgModule({
  imports: [CommonModule, FormsModule, TaskDetailsModule, NotificationsCenterModule],
  declarations: [AlarmIndicationComponent],
  exports: [AlarmIndicationComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    AlarmIndicationComponent
  ]
})
export class AlarmIndicationModule { }
