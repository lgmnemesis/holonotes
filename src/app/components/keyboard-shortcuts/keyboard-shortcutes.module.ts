import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { KeyboardShortcutsComponent } from './keyboard-shortcuts.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [KeyboardShortcutsComponent],
  exports: [KeyboardShortcutsComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    KeyboardShortcutsComponent
  ]
})
export class KeyboardShortcutsModule { }
