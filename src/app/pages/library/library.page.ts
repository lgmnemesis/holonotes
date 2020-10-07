import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, ModalController, PopoverController } from '@ionic/angular';
import { DatabaseService } from '../../services/database.service';
import { LibraryCollection } from '../../interfaces/library';
import { SharedService } from '../../services/shared.service';
import { AuthService } from '../../services/auth.service';
import { ManageCollectionComponent } from '../../components/manage-collection/manage-collection.component';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { InfiniteScrollingService } from '../../services/infinite-scrolling.service';
import { DataStoreService } from '../../services/data-store.service';
import { SortBy } from '../../enums/sort-by';
import { Subscription } from 'rxjs';
import { fade, translateYDownLong, translateYUp } from '../../models/animations';
import { TasksService } from '../../services/tasks.service';
import { SelectingSongCategory } from '../../interfaces/task';
import { AnalyticsService } from '../../services/analytics.service';
import { CreateProjectService } from '../../services/create-project.service';

@Component({
  selector: 'app-page-library',
  templateUrl: './library.page.html',
  styleUrls: ['./library.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYDownLong,
    translateYUp
  ]
})
export class LibraryPage implements OnInit, OnDestroy {

  @ViewChild(CdkVirtualScrollViewport, { static: true }) viewport: CdkVirtualScrollViewport;

  showHomeButton = true;
  showSearchBarButton = true;
  canPresent = true;
  searchText = '';
  sortByFilter: SortBy = SortBy.Date;
  sortByFilterStr = '';
  _libraryChange: Subscription;
  _screenRes: Subscription;
  _selectingSongCategory: Subscription;
  isActiveProfileButton = false;
  selectingSongCategory: SelectingSongCategory = null;

  constructor(public databaseService: DatabaseService,
    public sharedService: SharedService,
    private navCtrl: NavController,
    public auth: AuthService,
    public modalCtrl: ModalController,
    private popoverCtrl: PopoverController,
    private infiniteScrollingService: InfiniteScrollingService,
    public dataStore: DataStoreService,
    private cd: ChangeDetectorRef,
    private tasksService: TasksService,
    private analyticsService: AnalyticsService,
    private createProjectService: CreateProjectService) {}

  ngOnInit() {
    this.dataStore.registerToLibraryCollectios();
    this.sortByFilterStr = SortBy[this.sortByFilter];
    this._libraryChange = this.dataStore.libraryChange$.subscribe((res) => {
      this.markForCheck();
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.markForCheck();
      }
    });

    this._selectingSongCategory = this.tasksService.selectingSongCategory$
    .subscribe((res) => {
      if (res) {
        this.selectingSongCategory = res;
        this.markForCheck();
      }
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  listAllProjects() {
    const collection: LibraryCollection = {
      id: 'ALL',
      collection_description: 'ALL',
      name: 'ALL',
      timestamp: 0
    };
    this.gotoCollection(collection);
  }

  createProject() {
    this.createProjectService.gotoCreateProject();
  }

  gotoCollection(collecion: LibraryCollection) {
    this.navCtrl.navigateForward('collections/' + collecion.name);
    this.sharedService.currentCollectionId = collecion.id;
  }

  notesEventHandler(event) {
    if (event.type === 'profilePage') {
      this.gotoProfile(event.event);
    } else if (event.type === 'libraryPage') {
      this.updateLibraryFeed();
    } else if (event.type === 'search') {
      this.search(event);
    } else if (event.type === 'cancelSearch') {
      this.cancelSearch();
    }
  }

  updateLibraryFeed() {
    this.viewport.scrollToIndex(0);
  }

  createCollection() {
    this.presentNewCollectionModal();
  }

  gotoProfile(event: Event) {
    if (this.auth.isLoggedIn()) {
      this.presentPopover(event, UserProfileComponent, 'user-profile-popover');
    } else {
      this.navCtrl.navigateForward('profile');
    }
  }

  async presentPopover(ev: Event, component: any, cssClass: string) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;
    this.isActiveProfileButton = true;

    const popover = await this.popoverCtrl.create({
      component: component,
      event: ev,
      mode: 'ios',
      cssClass: cssClass
    });

    popover.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
      this.isActiveProfileButton = false;
      this.markForCheck();
    })
    .catch((error) => {
      this.canPresent = true;
      this.isActiveProfileButton = false;
      this.markForCheck();
      console.error(error);
    });

    return await popover.present();
  }

  async presentNewCollectionModal() {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const modal = await this.modalCtrl.create({
      component: ManageCollectionComponent,
      cssClass: 'manage-collection-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.shouldUpdate) {
          this.databaseService.createNewCollection(res.data.name)
          .then(() => {
            this.analyticsService.sendAddCollectionEvent();
          })
          .catch((error) => {
            console.error(error);
          });
        }
        this.canPresent = true;
      })
      .catch((error) => {
        this.canPresent = true;
        console.error(error);
      });

      return await modal.present();
  }

  nextScrollBatch(event) {
    const last = this.dataStore.libraryCollections ? this.dataStore.libraryCollections[this.dataStore.libraryCollections.length - 1] : null;
    const offset = last ? last.name : null;
    if (offset) {
      this.infiniteScrollingService.nextScrollBatch(this.viewport, offset, this.dataStore.libraryBatchParams);
    }
  }

  search(event) {
    if (event.event.keyCode) {
      // filter out keyboard event (keypress) - which are relevent only in home search when pressing ENTER
      return;
    }
    const value = event.event.detail.value;
    this.searchText = value;
  }

  cancelSearch() {
    this.searchText = '';
  }

  toggleSortByFilter() {
    this.sortByFilter++;
    if (this.sortByFilter === SortBy.Artist) {
      this.sortByFilter++;
    }
    let name = SortBy[this.sortByFilter];
    if (!name) {
      this.sortByFilter = 0;
      name = SortBy[this.sortByFilter];
    }
    this.sortByFilterStr = name;
  }

  cancelSelectingSongCategory() {
    if (this.selectingSongCategory) {
      this.selectingSongCategory.isSelecting = false;
      this.selectingSongCategory.project = null;
    }
    this.tasksService.selectingSongCategorySubject.next(this.selectingSongCategory);
  }

  ngOnDestroy() {
    if (this._libraryChange) {
      this._libraryChange.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._selectingSongCategory) {
      this._selectingSongCategory.unsubscribe();
    }
  }
}
