import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Routes, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ChallengesPage } from './challenges.page';
import { FeedSliderModule } from '../../components/feed-slider/feed-slider.module';
import { ChallengeContainerModalModule } from '../../components/project-challenge/challenge-container-modal.module';
import { SharedChallengePreviewModule } from '../../components/shared-challenge-preview/shared-challenge-preview.module';
import { SocialSharingPopoverModule } from '../../components/social-sharing-popover/social-sharing-popover.module';
import { Pipes } from '../../pipes/pipes.module';

const routes: Routes = [
  {
    path: '',
    component: ChallengesPage
  }
];

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild(routes),
    FeedSliderModule,
    ChallengeContainerModalModule,
    SharedChallengePreviewModule,
    SocialSharingPopoverModule,
    Pipes
  ],
  declarations: [ChallengesPage]
})
export class ChallengesPageModule {}
