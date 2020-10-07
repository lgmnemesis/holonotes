import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { JournalPage } from './journal.page';
import { ChatContainerModule } from '../../components/chat/chat-container/chat-container.module';
import { SideMenuModule } from '../../components/side-menu/side-menu.module';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { ChallengeModule } from '../../components/challenge/challenge.module';

const routes: Routes = [
  {
    path: '',
    component: JournalPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    SideMenuModule,
    ChatContainerModule,
    ChallengeModule,
    PickerModule
  ],
  declarations: [JournalPage]
})
export class JournalPageModule {}
