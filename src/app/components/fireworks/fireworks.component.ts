import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-fireworks',
  templateUrl: './fireworks.component.html',
  styleUrls: ['./fireworks.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FireworksComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
