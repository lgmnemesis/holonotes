import { Component, ChangeDetectionStrategy, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-welcome-view',
  templateUrl: './welcome-view.component.html',
  styleUrls: ['./welcome-view.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WelcomeViewComponent {

  @Input() showSignUpButton = false;
  @Output() welcomeEvent = new EventEmitter();


  constructor() { }

  signup() {
    this.welcomeEvent.next({signup: true});
  }

  getStarted() {
    this.welcomeEvent.next({getStarted: true});
  }
}
