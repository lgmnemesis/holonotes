import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatContainerComponent } from './chat-container.component';
import { Pipes } from '../../../pipes/pipes.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes],
  declarations: [ChatContainerComponent],
  exports: [ChatContainerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    ChatContainerComponent
  ]
})
export class ChatContainerModule { }
