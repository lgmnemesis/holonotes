import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JourneyInputContainerComponent } from './journey-input-container.component';
import { JourneyInputModule } from '../journey-input/journey-input.module';

@NgModule({
  imports: [CommonModule, FormsModule, JourneyInputModule],
  declarations: [JourneyInputContainerComponent],
  exports: [JourneyInputContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    JourneyInputContainerComponent
  ]
})
export class JourneyInputContainerModule { }
