import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProfilePage } from './profile.page';
import { SignInModule } from '../../components/sign-in/sign-in.module';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { ContactDetailsModule } from '../../components/contact-details/contact-details.module';

const routes: Routes = [
  {
    path: '',
    component: ProfilePage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    SignInModule,
    NotesToolbarModule,
    UserProfileModule,
    ContactDetailsModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
