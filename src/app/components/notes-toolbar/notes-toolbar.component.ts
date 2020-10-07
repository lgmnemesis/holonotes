import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-notes-toolbar',
  templateUrl: './notes-toolbar.component.html',
  styleUrls: ['./notes-toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotesToolbarComponent implements OnInit, OnDestroy {

  @Input() showHomeButton = true;
  @Input() showLibraryButton = true;
  @Input() showActivityButton = true;
  @Input() showProfileButton = true;
  @Input() isActiveProfileButton = false;
  @Input() showMoreOptionsButton = false;
  @Input() isSmallDisplay = false;
  @Input() showSearchBar = true;
  @Input() showCancelButton = false;
  @Input() homeTooltipText = 'Home';
  @Input() libraryTooltipText = 'Library';
  @Input() activityTooltipText = 'Activity';
  @Input() searchPlaceHolder = 'Search';
  @Output() notesEvent = new EventEmitter();

  searchText = '';
  isSearchBarFocused = false;
  isActiveSearchButton = false;
  _auth: Subscription;
  isActiveNotifications: false;

  constructor(public router: Router,
    public auth: AuthService,
    private cd: ChangeDetectorRef,
    public sharedService: SharedService) {
  }

  ngOnInit() {
    this._auth = this.auth.user$.subscribe(() => {
      this.markForCheck();
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  gotoHomePage(event) {
    this.goto('home', event);
  }

  gotoLibraryPage(event) {
    this.goto('library', event);
  }

  gotoActivityPage(event) {
    this.goto('activity', event);
  }

  goto(url: string, event) {
    this.searchText = '';
    this.router.navigateByUrl(url)
    .then(() => {
      this.notesEvent.next({type: url, event: event});
    })
    .catch((error) => {
      console.error(error);
    });
  }

  gotoSearchBar(event) {
    this.isActiveSearchButton = true;
  }

  cancelSearch(event) {
    this.searchText = '';
    this.isActiveSearchButton = false;
    this.notesEvent.next({type: 'cancelSearch', event: event});
  }

  userProfilePopoverEvent(event) {
    this.notesEvent.next({type: 'profilePage', event: event});
  }

  moreOptionsPopoverEvent(event) {
    this.notesEvent.next({type: 'moreOptionsPage', event: event});
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  search(event) {
    if (!event.keyCode && !event.charCode) {
      this.searchText = event.detail.value;
    }
    this.notesEvent.next({type: 'search', event: event});
  }

  ngOnDestroy() {
    if (this._auth) {
      this._auth.unsubscribe();
    }
  }
}
