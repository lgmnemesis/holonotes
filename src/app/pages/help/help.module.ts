import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HelpPage } from './help.page';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { HelpFooterModule } from '../../components/help-footer/help-footer.module';
import { ContactDetailsModule } from '../../components/contact-details/contact-details.module';
import { WelcomeViewModule } from '../../components/welcome-view/welcome-view.module';
import { SupportUsModule } from '../../components/support-us/support-us.module';

const routes: Routes = [
  {
    path: '',
    component: HelpPage
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
    HelpFooterModule,
    ContactDetailsModule,
    WelcomeViewModule,
    SupportUsModule
  ],
  declarations: [HelpPage]
})
export class HelpPageModule {}
