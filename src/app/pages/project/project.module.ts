import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ProjectPage } from './project.page';
import { VideoPlayerModule } from '../../components/video-player/video-player.module';
import { NotesToolbarModule } from '../../components/notes-toolbar/notes-toolbar.module';
import { VideoPlayerButtonsModule } from '../../components/video-player-buttons/video-player-buttons.module';
import { LeftsideContainerModule } from '../../components/leftside-container/leftside-container.module';
import { TimelineModule } from '../../components/timeline/timeline.module';
import { VideosModule } from '../../components/videos/videos.module';
import { EditBookmarkModule } from '../../components/edit-bookmark/edit-bookmark.module';
import { ManageVideosModule } from '../../components/manage-videos/manage-videos.module';
import { ManageProjectModule } from '../../components/manage-project/manage-project.module';
import { ManageAllItemsModule } from '../../components/manage-all-items/manage-all-items.module';
import { KeyboardShortcutsModule } from '../../components/keyboard-shortcuts/keyboard-shortcutes.module';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';
import {
  JourneyInputContainerPopoverModule
} from '../../components/journey-input-container-popover/journey-input-container-popover.module';
import { ChallengeContainerModalModule } from '../../components/project-challenge/challenge-container-modal.module';
import { Pipes } from '../../pipes/pipes.module';

const routes: Routes = [
  {
    path: '',
    component: ProjectPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    VideoPlayerModule,
    NotesToolbarModule,
    VideoPlayerButtonsModule,
    LeftsideContainerModule,
    TimelineModule,
    VideosModule,
    EditBookmarkModule,
    ManageVideosModule,
    ManageProjectModule,
    ManageAllItemsModule,
    KeyboardShortcutsModule,
    AlarmIndicationModule,
    JourneyInputContainerPopoverModule,
    ChallengeContainerModalModule,
    Pipes
  ],
  declarations: [ProjectPage]
})
export class ProjectPageModule { }
