import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { LibraryPage } from './library.page';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { UserProfileModule } from '../../components/user-profile/user-profile.module';
import { ManageCollectionModule } from '../../components/manage-collection/manage-collection.module';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { InfiniteScrollingService } from '../../services/infinite-scrolling.service';
import { Pipes } from '../../pipes/pipes.module';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';


const routes: Routes = [
  {
    path: '',
    component: LibraryPage
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
    ManageCollectionModule,
    ScrollingModule,
    Pipes,
    AlarmIndicationModule
  ],
  providers: [InfiniteScrollingService],
  declarations: [LibraryPage]
})
export class LibraryPageModule {}
