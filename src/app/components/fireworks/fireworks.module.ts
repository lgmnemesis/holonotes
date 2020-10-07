import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireworksComponent } from './fireworks.component';


@NgModule({
  imports: [CommonModule, FormsModule],
  declarations: [FireworksComponent],
  exports: [FireworksComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  entryComponents: [
    FireworksComponent
  ]
})
export class FireworksModule { }
