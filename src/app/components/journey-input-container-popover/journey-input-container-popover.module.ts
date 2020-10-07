import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JourneyInputContainerPopoverComponent } from './journey-input-container-popover.component';
import { JourneyInputContainerModule } from '../journey-input-container/journey-input-container.module';

@NgModule({
  imports: [CommonModule, FormsModule, JourneyInputContainerModule],
  declarations: [JourneyInputContainerPopoverComponent],
  exports: [JourneyInputContainerPopoverComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    JourneyInputContainerPopoverComponent
  ]
})
export class JourneyInputContainerPopoverModule { }
