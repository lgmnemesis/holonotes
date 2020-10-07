import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../interfaces/task';
import { TasksService } from '../services/tasks.service';

@Pipe({
  name: 'filterTasks'
})
export class FilterTasksPipe implements PipeTransform {

  constructor(private tasksService: TasksService) {
  }

  transform(tasks: Task[]): any {
    return this.tasksService.sortTasks(tasks);
  }
}
