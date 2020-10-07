import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HomePage } from './home.page';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';
import { FeedSliderModule } from '../../components/feed-slider/feed-slider.module';
import {TaskModule } from '../../components/motivation/task/task.module';
import { Pipes } from '../../pipes/pipes.module';
import { TaskDetailsModule } from '../../components/motivation/task-details/task-details.module';
import { WelcomeViewModule } from '../../components/welcome-view/welcome-view.module';
import { ContactDetailsModule } from '../../components/contact-details/contact-details.module';
import { HelpFooterModule } from '../../components/help-footer/help-footer.module';

const routes: Routes = [
  {
    path: '',
    component: HomePage
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
    AlarmIndicationModule,
    FeedSliderModule,
    TaskModule,
    Pipes,
    TaskDetailsModule,
    WelcomeViewModule,
    ContactDetailsModule,
    HelpFooterModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
