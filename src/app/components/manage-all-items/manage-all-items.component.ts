import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Timeline } from '../../interfaces/timeline';
import { Video } from '../../interfaces/video';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manage-all-items',
  templateUrl: './manage-all-items.component.html',
  styleUrls: ['./manage-all-items.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageAllItemsComponent implements OnInit, AfterViewInit, OnDestroy {

  isManageBookmarks = false;
  isManageVideos = false;
  modalTitle: string;
  items: any[] | Map<string, Timeline[]> | Video[];
  isSelected = new Map<number, boolean>();
  selectedCounter = 0;
  canSave = false;
  itemsLength = 0;
  nameMaxLength = 0;
  currentLabel = new Map<string, string>();
  _router: Subscription;

  constructor(private modalCtrl: ModalController,
      private navParams: NavParams,
      private sharedService: SharedService,
      private router: Router) { }

  ngOnInit() {
    this.isManageBookmarks = this.navParams.get('itemsName') === 'bookmarks';
    this.isManageVideos = !this.isManageBookmarks;
    this.nameMaxLength = this.sharedService.inputNameMaxLength;

    let orgItems;
    if (this.isManageBookmarks) {
      this.modalTitle = 'Manage Bookmarks';
      this.items = new Map(this.sharedService.timelineMap);
      this.itemsLength = this.sharedService.currentProject.bookmarks.length;
    } else {
      this.modalTitle = 'Manage Videos';
      orgItems = this.sharedService.currentProject.videos;
      this.itemsLength = orgItems.length;
      this.items = JSON.parse(JSON.stringify(orgItems));
    }

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.close();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#manage-all-i-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  isItemSelected(id: number) {
    return this.isSelected.get(id);
  }

  toggleSelectedItem(event, id: number) {
    const checked = event.detail.checked;
    this.isSelected.set(id, checked);
    if (checked) {
      this.selectedCounter++;
    } else {
      this.selectedCounter--;
    }
  }

  deleteSelected() {
    if (this.selectedCounter > 0) {
      if (this.isManageVideos) {
        const newItems = [];
        for (let index = 0; index < (<Video[]>this.items).length; index++) {
          const element: Video = this.items[index];
          if (!this.isSelected.get(element.id)) {
            newItems.push(element);
          }
        }
        this.items = newItems;
      } else {
        this.items.forEach((bookmarks, tagName) => {
          const newItems = [];
          for (let index = 0; index < bookmarks.length; index++) {
            const element: Timeline = bookmarks[index];
            if (!this.isSelected.get(element.id)) {
              newItems.push(element);
            }
          }
          (<Map<string, Timeline[]>>this.items).set(tagName, newItems);
        });
      }
      this.canSave = true;
    }
  }

  toggleCheckAll() {
    const isSelectAll = !(this.selectedCounter === this.itemsLength);

    if (this.isManageBookmarks) {
      this.items.forEach((bookmarks, tagName) => {
        bookmarks.forEach(element => {
          this.isSelected.set(element.id, isSelectAll);
        });
      });
    } else {
      this.items.forEach(item => {
        this.isSelected.set(item.id, isSelectAll);
      });
    }
  }

  inputName(event, key: string) {
    this.currentLabel[key] = event.detail.value;
    if (this.currentLabel[key] !== this.items[key]) {
      this.canSave = true;
    }
  }

  close(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  trackByKey(i, pair) {
    return pair.key;
  }

  trackById(i, bookmark: Timeline) {
    return bookmark.id;
  }

  save() {
    let data;
    if (this.isManageBookmarks) {
      const bookmarks = [];
      (<Map<string, Timeline[]>>this.items).forEach((value: Timeline[], key) => {
        value.forEach(bookmark => {
          if (this.currentLabel[key] != null &&
            this.currentLabel[key] !== undefined &&
            bookmark.tag_name !== this.currentLabel[key]) {
            bookmark.tag_name = this.currentLabel[key];
          }
          bookmarks.push(bookmark);
        });
      });
      data = {update: true, bookmarks: bookmarks};
    } else if (this.isManageVideos) {
      data = {update: true, videos: this.items};
    }
    this.close(data);
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
