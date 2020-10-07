import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalController, NavParams, AlertController } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Project } from '../../interfaces/project';
import { AuthService } from '../../services/auth.service';
import { DatabaseService } from '../../services/database.service';
import { ProjectPage } from '../../pages/project/project.page';
import { environment } from '../../../environments/environment';
import { Video } from '../../interfaces/video';
import { DataStoreService } from '../../services/data-store.service';
import { LibraryCollection } from '../../interfaces/library';
import { Subscription } from 'rxjs';
import { fade, translateYDown } from '../../models/animations';
import { NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-manage-project',
  templateUrl: './manage-project.component.html',
  styleUrls: ['./manage-project.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYDown
  ]
})
export class ManageProjectComponent implements OnInit, AfterViewInit, OnDestroy {

  BASE_URL = environment.BASE_URL;

  deleteMessageText = '';

  modalTitle = '';
  projectNameText = '';
  saveButtonText = 'Save';
  project: Project;
  projectPageComponent: ProjectPage;
  name = '';
  artist = '';
  nameMaxLength: number;
  canSave = new Map<string, boolean>();
  editedName = '';
  editArtist = '';
  showInstructions: false;
  isChangeCoverPictureChecked = false;
  isProjectPublic = false;
  cover_img: string;
  activeCoverId: number;
  canPresent = true;
  isManageCollectionChecked = false;
  searchText = '';
  isSearchBarFocused = false;
  collectionsChecked = new Map<string, boolean>();
  libraryCollections: LibraryCollection[] = [];
  _libraryChange: Subscription;
  _router: Subscription;
  alertAction: HTMLIonAlertElement;
  isMyProject = false;

  constructor(private sharedService: SharedService,
    private modalCtrl: ModalController,
    private navParams: NavParams,
    private alertCtrl: AlertController,
    public authService: AuthService,
    public databaseService: DatabaseService,
    public dataStore: DataStoreService,
    private cd: ChangeDetectorRef,
    private router: Router) { }

  async ngOnInit() {
    this.nameMaxLength = this.sharedService.inputNameMaxLength;
    this.project = this.navParams.get('project');
    this.projectPageComponent = this.navParams.get('projectPageComponent');
    this.showInstructions = this.navParams.get('showInstructions');
    this.editedName = this.project.name;
    this.editArtist = this.project.artist;
    const user = await this.authService.getUser();
    this.isMyProject = user && this.project.user_id === user.uid;
    this.isProjectPublic = this.project.is_public;
    if (this.editedName) {
      this.modalTitle = 'Project Options';
      this.projectNameText = 'Project Name';
      this.name = this.editedName;
      this.artist = this.editArtist;
    }
    if (this.showInstructions) {
      this.modalTitle = 'Project Introduction';
      this.saveButtonText = 'Done';
      this.canSave.set('new', true);
    }

    this.project.collections.forEach(id => {
      this.collectionsChecked.set(id, true);
    });

    if (this.authService.isLoggedIn()) {
      this._libraryChange = this.dataStore.registerToLibraryCollectios()
      .subscribe((res) => {
        this.cd.markForCheck();
      });
    }

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        if (this.alertAction) {
          this.alertAction.dismiss().catch(error => console.error(error));
        }
        this.closeAllModalsSync();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#manage-proj-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  async closeAllModalsSync() {
    return await this.modalCtrl.dismiss()
    .then(() => {
      this.closeAllModalsSync();
    }).catch(() => true);
  }

  inputId(event) {
    this.name = event.detail.value;
    const save = this.name.trim() !== '' && this.name.trim() !== this.editedName;
    this.canSave.set('name', save);
  }

  inputArtist(event) {
    this.artist = event.detail.value;
    const save = this.artist.trim() !== this.editArtist;
    this.canSave.set('artist', save);
  }

  close(data?: any) {
    this.modalCtrl.dismiss(data);
  }

  signIn() {
    this.close({'signIn': true});
  }

  delete() {
    this.presentAlertConfirm();
  }

  async presentAlertConfirm() {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    this.alertAction = await this.alertCtrl.create({
      header: 'Delete Project?',
      message: this.deleteMessageText,
      mode: 'ios',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Delete',
          handler: () => {
            const data = { shouldUpdate: false, shouldDelete: true };
            this.close(data);
          }
        }
      ]
    });

    this.alertAction.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
    })
    .catch((error) => {
      this.canPresent = true;
      console.error(error);
    });

    await this.alertAction.present();
  }

  showKeyboardShortcuts() {
    this.projectPageComponent.presentKeyboardShortcuts().catch((error) => {
      console.error(error);
    });
  }

  saveOnEnter(event) {
    if (event.keyCode === 13) {
      this.save();
    }
  }

  save() {
    if (this.canSave.get('new')) {
      this.close();
      return;
    }

    if (this.isCanSave()) {
      const collections = [];
      this.collectionsChecked.forEach((value, key) => {
        if (value) {
          collections.push(key);
        }
      });

      const data = {
        shouldUpdate: true,
        name: this.name.trim(),
        artist: this.artist.trim(),
        is_public: this.isProjectPublic,
        cover_img: this.cover_img,
        collections: collections
      };

      this.close(data);
    }
  }

  copy() {
    const data = { shouldCopy: true };
    this.close(data);
  }

  isProjectOwner() {
    return this.databaseService.isProjectOwner(this.project);
  }

  toggleCoverPictureChecked() {
    this.isChangeCoverPictureChecked = !this.isChangeCoverPictureChecked;
    if (!this.isChangeCoverPictureChecked) {
      this.cover_img = null;
      this.canSave.set('cover', false);
    }
  }

  toggleProjectIsPublic() {
    this.isProjectPublic = !this.isProjectPublic;
    this.canSave.set('public', this.isProjectPublic !== this.project.is_public);
  }

  coverPictureSelected(video: Video) {
    this.cover_img = video.thumbnail_url;
    this.activeCoverId = video.id;
    this.canSave.set('cover', true);
  }

  isActiveCover(video: Video) {
    return this.activeCoverId === video.id;
  }

  isCanSave() {
    let save = false;
    this.canSave.forEach(value => {
      if (value) {
        save = true;
      }
    });
    return save;
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  search(event) {
    const value = event.detail.value;
    this.searchText = value;
  }

  toggleManageCollections() {
    if (this.libraryCollections.length < 1) {
      this.libraryCollections = this.dataStore.libraryCollections.sort((a, b) => {
        const a2 = a.id;
        const b2 = b.id;
        const a3 = this.project.collections.includes(a2);
        const b3 = this.project.collections.includes(b2);
        return a3 && !b3 ? -1 : b3 && !a3 ? 1 : 0;
      });
    }
    this.isManageCollectionChecked = !this.isManageCollectionChecked;
  }

  toggleManageCollectionChecked(event, collection: LibraryCollection) {
    const isChecked = event.detail.checked;
    this.collectionsChecked.set(collection.id, isChecked);
    this.canSave.set('collections', true);
  }

  ngOnDestroy() {
    if (this._libraryChange) {
      this._libraryChange.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
