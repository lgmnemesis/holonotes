import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChallengeContainerModalComponent } from './challenge-container-modal.component';
import { ChallengeModule } from '../challenge/challenge.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ChallengeModule
  ],
  declarations: [ChallengeContainerModalComponent],
  exports: [ChallengeContainerModalComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ChallengeContainerModalComponent
  ]
})
export class ChallengeContainerModalModule { }
