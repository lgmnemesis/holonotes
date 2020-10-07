import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskDetailsComponent } from './task-details.component';
import { Pipes } from '../../../pipes/pipes.module';
import { TaskCategoriesModule } from '../task-categories/task-categories.module';
import { ProgressBarCircleModule } from '../../progress-bar-circle/progress-bar-circle.module';
import { CountdownModule } from '../../countdown/countdown.module';
import { FireworksModule } from '../../fireworks/fireworks.module';
import { CategoryModule } from '../category/category.module';
import { ChallengeModule } from '../../challenge/challenge.module';
import { SocialSharingModule } from '../../social-sharing/social-sharing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    Pipes,
    TaskCategoriesModule,
    ProgressBarCircleModule,
    CountdownModule,
    FireworksModule,
    CategoryModule,
    ChallengeModule,
    SocialSharingModule
  ],
  declarations: [TaskDetailsComponent],
  exports: [TaskDetailsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    TaskDetailsComponent
  ]
})
export class TaskDetailsModule { }
