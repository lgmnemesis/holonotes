import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SharedChallengePreviewComponent } from './shared-challenge-preview.component';
import { Pipes } from '../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [SharedChallengePreviewComponent],
  exports: [SharedChallengePreviewComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    SharedChallengePreviewComponent
  ]
})
export class SharedChallengePreviewModule { }
