import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { PrivacyPage } from './privacy.page';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { HelpFooterModule } from '../../components/help-footer/help-footer.module';

const routes: Routes = [
  {
    path: '',
    component: PrivacyPage
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
    HelpFooterModule
  ],
  declarations: [PrivacyPage]
})
export class PrivacyPageModule {}
