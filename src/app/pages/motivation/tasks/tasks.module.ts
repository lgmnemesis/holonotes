import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TasksPage } from './tasks.page';
import { NotesToolbarModule } from '../../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../../components/user-profile/user-profile.module';
import { TaskModule } from '../../../components/motivation/task/task.module';
import { TaskDetailsModule } from '../../../components/motivation/task-details/task-details.module';
import { Pipes } from '../../../pipes/pipes.module';
import { AlarmIndicationModule } from '../../../components/motivation/alarm-indication/alarm-indication.module';

const routes: Routes = [
  {
    path: '',
    component: TasksPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    NotesToolbarModule,
    UserProfileModule,
    TaskModule,
    TaskDetailsModule,
    Pipes,
    AlarmIndicationModule,
  ],
  declarations: [TasksPage]
})
export class TasksPageModule {}
