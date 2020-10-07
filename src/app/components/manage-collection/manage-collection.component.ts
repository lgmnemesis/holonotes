import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Project } from '../../interfaces/project';
import { LibraryCollection } from '../../interfaces/library';
import { DataStoreService } from '../../services/data-store.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-manage-collection',
  templateUrl: './manage-collection.component.html',
  styleUrls: ['./manage-collection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManageCollectionComponent implements OnInit, OnDestroy {

  modalTitle = 'New Collection';
  name = '';
  nameMaxLength: number;
  canSave = false;
  selectedProjects: Map<Project, boolean>;
  action = '';
  isNewCollection = true;
  isSearchBarFocused = false;
  collectionsChecked = new Map<string, boolean>();
  libraryCollections: LibraryCollection[] = [];
  searchText = '';
  collectionsCheckedCounter = 0;
  selectCollectionsText = '';
  prevCheckId = '';
  errorMessage = '';
  onlyOneProject = [];
  _router: Subscription;

  constructor(private sharedService: SharedService,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private dataStore: DataStoreService,
    private router: Router) { }

  ngOnInit() {
    this.libraryCollections = this.dataStore.libraryCollections.filter((collection) => {
      return !collection.dontShow;
    });
    this.nameMaxLength = this.sharedService.inputNameMaxLength;
    this.action =  this.navParams.get('action');
    this.onlyOneProject = this.navParams.get('onlyProject') || [];
    if (this.action) {
      this.isNewCollection = false;
    }
    if (this.action === 'add') {
      this.modalTitle = 'Add to Collections';
      this.selectCollectionsText = 'Select collections to Add to';
    } else if (this.action === 'move') {
      this.modalTitle = 'Move to Collection';
      this.selectCollectionsText = 'Select collection to Move to';
    }

    if (this.libraryCollections.length === 0) {
      this.isNewCollection = true;
    }

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.close();
      }
    });
  }

  inputId(event) {
    this.name = event.detail.value;
    this.canSave = this.name.trim() !== '' ? true : false;
  }

  close(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  saveOnEnter(event) {
    if (event.keyCode === 13) {
      this.save();
    }
  }

  save() {
    if (this.canSave) {
      let data;
      if (this.isNewCollection) {
        // Check that collection name is unique
        const nameExists = this.libraryCollections.filter((collection) => {
          return collection.name === this.name;
        });
        if (nameExists.length > 0) {
          this.errorMessage = 'Please choose a different name (this one already exists in your library)';
          return;
        }
        data = { shouldUpdate: true, name: this.name };
      } else {
        const ids = [];
        this.collectionsChecked.forEach((isSelected, id) => {
          if (isSelected) {
            ids.push(id);
          }
        });
        data = { shouldUpdateCollections: true, ids: ids };
      }
      this.close(data);
    }
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  search(event) {
    const value = event.detail.value;
    this.searchText = value;
  }

  toggleManageCollectionChecked(event, collection: LibraryCollection) {
    const isChecked = event.detail.checked;
    this.collectionsChecked.set(collection.id, isChecked);
    if (isChecked) {
      this.collectionsCheckedCounter++;
    } else {
      this.collectionsCheckedCounter--;
    }
    this.canSave = this.collectionsCheckedCounter > 0;
  }

  toggleManageCollectionCheckedMove(event, collection: LibraryCollection) {
    const isChecked = event.detail.checked;
    this.collectionsChecked.set(collection.id, isChecked);
    if (this.prevCheckId === '') {
      this.prevCheckId = collection.id;
    }
    if (isChecked && this.prevCheckId !== collection.id) {
      this.collectionsChecked.set(this.prevCheckId, false);
      this.prevCheckId = collection.id;
    }
    this.canSave = this.collectionsChecked.get(this.prevCheckId);
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
