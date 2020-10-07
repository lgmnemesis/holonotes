import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { ExplorePage } from './explore.page';
import { Routes, RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { InfiniteScrollingService } from '../../services/infinite-scrolling.service';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';

const routes: Routes = [
  {
    path: '',
    component: ExplorePage
  }
];
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    ScrollingModule,
    AlarmIndicationModule
  ],
  providers: [InfiniteScrollingService],
  declarations: [ExplorePage]
})
export class ExplorePageModule {}
