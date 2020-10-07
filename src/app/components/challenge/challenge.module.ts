import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChallengeComponent } from './challenge.component';
import { ProgressBarCircleModule } from '../progress-bar-circle/progress-bar-circle.module';

@NgModule({
  imports: [CommonModule, FormsModule, ProgressBarCircleModule],
  declarations: [ChallengeComponent],
  exports: [ChallengeComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ChallengeComponent
  ]
})
export class ChallengeModule { }
