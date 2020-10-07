import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CreateProjectPage } from './create-project.page';
import { NameAndUrlModule } from '../../components/new-project-form/name-and-url/name-and-url.module';

const routes: Routes = [
  {
    path: '',
    component: CreateProjectPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    NameAndUrlModule
  ],
  declarations: [CreateProjectPage]
})
export class CreateProjectPageModule {}
