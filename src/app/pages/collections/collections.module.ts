import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CollectionsPage } from './collections.page';
import { ManageProjectModule } from '../../components/manage-project/manage-project.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { InfiniteScrollingService } from '../../services/infinite-scrolling.service';
import { Pipes } from '../../pipes/pipes.module';
import { ManageCollectionModule } from '../../components/manage-collection/manage-collection.module';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';

const routes: Routes = [
  {
    path: '',
    component: CollectionsPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ManageProjectModule,
    ScrollingModule,
    Pipes,
    ManageCollectionModule,
    AlarmIndicationModule
  ],
  providers: [InfiniteScrollingService],
  declarations: [CollectionsPage]
})
export class CollectionsPageModule {}
