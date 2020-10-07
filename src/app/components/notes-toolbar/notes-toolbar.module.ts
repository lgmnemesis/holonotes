import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotesToolbarComponent } from './notes-toolbar.component';
import { Pipes } from '../../pipes/pipes.module';
import { AlarmIndicationModule } from '../../components/motivation/alarm-indication/alarm-indication.module';

@NgModule({
  imports: [CommonModule, FormsModule, Pipes, AlarmIndicationModule],
  declarations: [NotesToolbarComponent],
  exports: [NotesToolbarComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NotesToolbarModule { }
