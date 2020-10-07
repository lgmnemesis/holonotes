import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { StartPage } from './start.page';
import { SignInModule } from '../../components/sign-in/sign-in.module';
import { ChallengeModule } from '../../components/challenge/challenge.module';

const routes: Routes = [
  {
    path: '',
    component: StartPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    SignInModule,
    ChallengeModule
  ],
  declarations: [StartPage]
})
export class StartPageModule {}
