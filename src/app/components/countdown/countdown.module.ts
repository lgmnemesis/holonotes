import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CountdownComponent } from './countdown.component';

@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [CountdownComponent],
  exports: [CountdownComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    CountdownComponent
  ]
})
export class CountdownModule { }
