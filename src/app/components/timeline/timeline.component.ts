import { Component, OnInit, Input, Output, OnDestroy, EventEmitter,
  ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { PopoverController, ActionSheetController } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Timeline } from '../../interfaces/timeline';
import { TimelineMoreComponent } from '../../components/timeline-more/timeline-more.component';
import { Subscription } from 'rxjs';
import { fade, translateYUp, heightDownFast } from '../../models/animations';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYUp,
    heightDownFast
  ]
})
export class TimelineComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() set inputEvent(value: any) {
    if (value.type && value.type === 'sort') {
      this.sort();
    } else if (value.type && value.type === 'open') {
      this.open();
    }
  }

  @Output() selectedEvent = new EventEmitter();

  hideAllBookmarks = false;
  _timelineUpdated: Subscription;
  _router: Subscription;
  arrowIconName = 'arrow-up';
  actionSheet: HTMLIonActionSheetElement;
  popover: HTMLIonPopoverElement;

  constructor(public sharedService: SharedService,
    private popoverCtrl: PopoverController,
    private actionSheetCtrl: ActionSheetController,
    private cd: ChangeDetectorRef,
    private router: Router) {
  }

  ngOnInit() {
    // Disable default 'space key' behaivur of scolling down the page when pressed.
    try {
      window.onkeydown = function(e) {
        if (e.code === 'Space' && e.target === document.body) {
          e.preventDefault();
        }
      };
    } catch (error) {
      console.error(error);
    }

    this.sharedService.timelineMap = new Map<string, Timeline[]>();
    this.sharedService.showBookmarksForTag = new Map<string, boolean>();
    this.sharedService.updateTimeLineWithMenuMap();
    this.toggleSort();

    this._timelineUpdated = this.sharedService.projectUpdated$.subscribe((res) => {
      if (res.includes('bookmarks')) {
        this.cd.markForCheck();
      }
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        if (this.actionSheet) {
          this.actionSheet.dismiss().catch(error => console.error(error));
        }
        if (this.popover) {
          this.popover.dismiss().catch(error => console.error(error));
        }
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#timeline-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  sort() {
    this.toggleSort();
  }

  toggleSort() {
    this.hideAllBookmarks = !this.hideAllBookmarks;
    let wasChanged = false;
    this.sharedService.timelineMap.forEach((value: Timeline[], key: string) => {
      const current = this.sharedService.showBookmarksForTag.get(key);
      if (current !== this.hideAllBookmarks) {
        wasChanged = true;
        this.sharedService.showBookmarksForTag.set(key, this.hideAllBookmarks);
      }
    });
    if (!wasChanged) {
      this.hideAllBookmarks = !this.hideAllBookmarks;
      this.sharedService.timelineMap.forEach((value: Timeline[], key: string) => {
        this.sharedService.showBookmarksForTag.set(key, this.hideAllBookmarks);
      });
    }
  }

  open() {
    this.selectedEvent.next({type: 'manage-all-bookmarks'});
  }

  bookmarkSelected(event, bookmark: Timeline) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      this.selectedEvent.next({type: 'timeline', bookmark: bookmark});
    }
  }

  private overwriteBookmark(id: number) {
    this.selectedEvent.next({type: 'overwriteBookmark', id: id});
  }

  private editBookmark(id: number) {
    this.selectedEvent.next({type: 'editBookmark', id: id});
  }

  private delete(id: number) {
    this.selectedEvent.next({type: 'deleteBookmark', id: id});
  }

  moreButtonWasPressed(event, timeline: Timeline) {
    event.stopPropagation();
    if (this.sharedService.eventShouldBeTrigger(event)) {
      if (this.sharedService.isLessThanMediumWindowWidth()) {
        this.presentActionSheet(timeline.id);
      } else {
        this.presentPopover(event, TimelineMoreComponent, timeline);
      }
    }
  }

  async presentActionSheet(id: number) {
    this.actionSheet = await this.actionSheetCtrl.create({
      cssClass: 'timeline-component-action-sheet',
      buttons:
        [
          {
            text: 'Overwrite Bookmark',
            icon: 'save',
            cssClass: 'action-sheet-open',
            handler: () => {
              this.overwriteBookmark(id);
            }
          },
          {
            text: 'Edit Bookmark',
            icon: 'create',
            cssClass: 'action-sheet-open',
            handler: () => {
              this.editBookmark(id);
            }
          }, {
            text: 'Delete Bookmark',
            icon: 'trash',
            cssClass: 'action-sheet-delete',
            handler: () => {
              this.delete(id);
            }
          }, {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel',
            handler: () => {
            }
          }
        ]
    });
    this.actionSheet.present();
  }

  async presentPopover(ev: Event, component: any, timeline: Timeline) {
    this.popover = await this.popoverCtrl.create({
      component: component,
      event: ev,
      cssClass: 'timeline-popover',
      mode: 'ios'
    });
    this.popover.onDidDismiss()
    .then((res) => {
      if (res && res.data) {
        if (res.data.action === 'overwrite') {
          this.overwriteBookmark(timeline.id);
        } else if (res.data.action === 'edit') {
          this.editBookmark(timeline.id);
        } else if (res.data.action === 'delete') {
          this.delete(timeline.id);
        }
      }
    })
    .catch((error) => {
      console.error(error);
    });

    return await this.popover.present();
  }

  tagWasPressed(event, key: string) {
    if (this.sharedService.eventShouldBeTrigger(event)) {
      const wasPressed = this.sharedService.tagWasPressed(key);
      this.arrowIconName = wasPressed ? 'arrow-up' : 'arrow-down';
    }
  }

  trackByKey(i, pair) {
    return pair.key;
  }

  trackById(i, bookmark: Timeline) {
    return bookmark.id;
  }

  ngOnDestroy() {
    if (this._timelineUpdated) {
      this._timelineUpdated.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
