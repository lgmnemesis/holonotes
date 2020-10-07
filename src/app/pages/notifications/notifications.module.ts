import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NotificationsPage } from './notifications.page';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { NotificationsCenterModule } from '../../components/notifications-center/notifications-center.module';

const routes: Routes = [
  {
    path: '',
    component: NotificationsPage
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
    NotificationsCenterModule
  ],
  declarations: [NotificationsPage]
})
export class NotificationsPageModule {}
