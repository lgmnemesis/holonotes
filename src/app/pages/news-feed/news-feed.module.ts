import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NewsFeedPageRoutingModule } from './news-feed-routing.module';
import { NewsFeedPage } from './news-feed.page';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewsFeedPageRoutingModule,
    Pipes
  ],
  declarations: [NewsFeedPage]
})
export class NewsFeedPageModule {}
