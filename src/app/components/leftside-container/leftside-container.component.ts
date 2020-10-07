import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-leftside-container',
  templateUrl: './leftside-container.component.html',
  styleUrls: ['./leftside-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LeftsideContainerComponent {

  @Output() selectedEvent = new EventEmitter();

  _name: string;
  title = '';
  timelineEvent = {};
  videosEvent = {};

  constructor(private sharedService: SharedService) {}

  @Input() set viewName(name: string) {
   this.resetHeader();
    this._name = name;
    if (!name || name === '') {
      this._name = 'timeline';
    }
    if (this._name === 'timeline') {
      this.title = 'Bookmarks';
    } else if (this._name === 'videos') {
      this.title = 'Videos';
    }
  }

  open(event: Event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.action({type: 'open'});
    }
  }

  add(event: Event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.action({type: 'add'});
    }
  }

  sort(event: Event) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.action({type: 'sort'});
    }
  }

  action(action) {
    if (this._name === 'timeline') {
      this.timelineEvent = action;
    } else if (this._name === 'videos') {
      this.videosEvent = action;
    }
  }

  private resetHeader() {
    this.videosEvent = {};
    this.timelineEvent = {};
  }

  emitSelectedEvent(event: Event) {
    this.selectedEvent.next(event);
  }
}
