import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { Task } from '../../../interfaces/task';
import { TasksSchedulerService } from '../../../services/tasks-scheduler.service';
import { TasksService } from '../../../services/tasks.service';
import { DateTimeService } from '../../../date-time.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskComponent implements OnInit {

  @Input() task: Task;
  @Input() isTaskStarted = false;
  @Input() showIcon = true;
  @Output() clickEvent = new EventEmitter();

  weekInMinutes = this.dateTimeService.WEEK_IN_MINUTES;

  constructor(public tasksSchedulerService: TasksSchedulerService,
    public dateTimeService: DateTimeService) { }

  ngOnInit() {
  }

  gotoTask() {
    this.clickEvent.next('clicked');
  }
}
