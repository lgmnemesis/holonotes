import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TermsPage } from './terms.page';
import { HelpFooterModule } from '../../components/help-footer/help-footer.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';

const routes: Routes = [
  {
    path: '',
    component: TermsPage
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
  declarations: [TermsPage]
})
export class TermsPageModule {}
