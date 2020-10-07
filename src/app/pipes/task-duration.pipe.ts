import { Pipe, PipeTransform } from '@angular/core';
import { Task } from '../interfaces/task';
import { TasksSchedulerService } from '../services/tasks-scheduler.service';
import { TasksService } from '../services/tasks.service';

@Pipe({
  name: 'taskDuration'
})
export class TaskDurationPipe implements PipeTransform {

  constructor(private tasksSchedulerService: TasksSchedulerService,
    private tasksService: TasksService) {
  }

  transform(task: Task): any {
    return this.calcDuration(task);
  }

  calcDuration(task: Task): string {
    let total = 0;
    if (task.challenge && task.challenge.is_challenge) {
      total = this.tasksService.getDurationInMinutes(task.challenge.duration);
      return this.tasksService.hoursAndMinutes(total);
    }
    const ids = task.categories_ids;
    const taskCategories = [];
    const allCategories = this.tasksSchedulerService.categories;
    ids.forEach(id => {
      const category = allCategories.find(c => c.id === id);
      if (category) {
        total += this.tasksService.getDurationInMinutes(category.duration);
        taskCategories.push(category);
      }
    });

    return this.tasksService.hoursAndMinutes(total);
  }
}
