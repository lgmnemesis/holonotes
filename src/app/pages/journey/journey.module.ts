import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { JourneyPage } from './journey.page';
import { JourneyModule } from '../../components/journey/journey.module';

const routes: Routes = [
  {
    path: '',
    component: JourneyPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    JourneyModule
  ],
  declarations: [JourneyPage]
})
export class JourneyPageModule {}
