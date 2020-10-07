import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NavController, ActionSheetController, ModalController, AlertController } from '@ionic/angular';
import { DatabaseService } from '../../services/database.service';
import { Subscription } from 'rxjs';
import { Project } from '../../interfaces/project';
import { SharedService } from '../../services/shared.service';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { SortBy } from '../../enums/sort-by';
import { ManageCollectionComponent } from '../../components/manage-collection/manage-collection.component';
import { fade, translateYDown, translateYUp, heightDown } from '../../models/animations';
import { ProjectOptionsService } from '../../services/project-options.service';
import { CreateProjectService } from '../../services/create-project.service';
import { DataStoreService } from '../../services/data-store.service';
import { TasksService } from '../../services/tasks.service';
import { SelectingSongCategory } from '../../interfaces/task';
import { AnalyticsService } from '../../services/analytics.service';

interface DeleteAction {
  action: 'deleteCollection' | 'removeFromCollection' | 'deleteProjects';
}

@Component({
  selector: 'app-page-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    heightDown,
    translateYDown,
    translateYUp
  ]
})
export class CollectionsPage implements OnInit, OnDestroy {

  @ViewChild(CdkVirtualScrollViewport, { static: true }) viewport: CdkVirtualScrollViewport;

  collectionName = '';
  newCollectionName = '';
  collectionId;
  projects: Project[];
  _projects: Subscription;
  isSubscribedToAllProjects = false;
  defaultCoverImg = this.sharedService.defaultCoverImg;
  canPresent = true;
  isSearchBarFocused = false;
  isEditMode = false;
  deleteMessageText = 'This will only delete the collection folder. Actual projects are in your library';
  nameMaxLength = this.sharedService.inputNameMaxLength;
  canSave = false;
  isAddToCollection = false;
  projectsToSelect = new Map<Project, boolean>();
  manageCollectionText = '';
  checkMenuText = '';
  searchText = '';
  isActiveSearchButton = false;
  sortByFilter: SortBy = SortBy.Date;
  sortByFilterStr = '';
  isEditAllMode = false;
  editModeDeleteText = '';
  canEditCollections = false;
  isSelectAll = false;
  selectAllText = 'Select All';
  isSearching = false;
  _screenRes: Subscription;
  _editProject: Subscription;
  _selectingSongCategory: Subscription;
  _router: Subscription;
  isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
  isEditProject = false;
  editProject: Project = null;
  isOnlyProject = false;
  selectingSongCategory: SelectingSongCategory = null;
  actionSheet: HTMLIonActionSheetElement;
  alertAction: HTMLIonAlertElement;

  constructor(private route: ActivatedRoute,
    private databaseService: DatabaseService,
    private navCtrl: NavController,
    public sharedService: SharedService,
    private actionSheetCtrl: ActionSheetController,
    private modalCtrl: ModalController,
    private alertCtrl: AlertController,
    private cd: ChangeDetectorRef,
    private projectOptionsService: ProjectOptionsService,
    private createProjectService: CreateProjectService,
    private dataStoreService: DataStoreService,
    private tasksService: TasksService,
    private analyticsService: AnalyticsService,
    private router: Router) {}

  ngOnInit() {
    this.sortByFilterStr = SortBy[this.sortByFilter];
    const id = this.route.snapshot.paramMap.get('id');
    this.collectionName = id;
    this.newCollectionName = id;
    this.collectionId = this.sharedService.currentCollectionId;
    this.isSearching = false;

    this._projects = this.dataStoreService.registerToLibraryAllProjects()
    .subscribe((projects) => {
      if (projects) {
        this.reloadCollection(this.collectionId === 'ALL');
        this.isSearching = false;
      }
      this.markForCheck();
    });

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.isLessThanMediumWindowWidth = this.sharedService.isLessThanMediumWindowWidth();
        this.markForCheck();
      }
    });

    this._editProject = this.projectOptionsService.onHandler$.subscribe((res) => {
      if (res && res.editProject && res.project) {
        this.setEditProjectMode(res.project);
      } else if (res && res.deleteSelected && res.project) {
        this.isOnlyProject = true;
        this.projectsToSelect.set(res.project, true);
        this.deleteSelected();
      }
    });

    this._selectingSongCategory = this.tasksService.selectingSongCategory$
    .subscribe((res) => {
      if (res) {
        this.selectingSongCategory = res;
        this.markForCheck();
      }
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        if (this.actionSheet) {
          this.actionSheet.dismiss().catch(error => console.error(error));
        }
        if (this.alertAction) {
          this.alertAction.dismiss().catch(error => console.error(error));
        }
        if (this.projectOptionsService.actionSheet) {
          this.projectOptionsService.actionSheet.dismiss().catch(error => console.error(error));
        }
      }
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  reloadCollection(isAll: boolean) {
    const projects = this.dataStoreService.libraryAllProjects;
    if (isAll) {
      this.projects = projects;
    } else {
      this.projects = projects.filter(project => {
        return project.collections.includes(this.collectionId);
      });
    }
    this.isSearching = false;
  }

  gotoProject(project: Project) {
    if (this.selectingSongCategory && this.selectingSongCategory.isSelecting) {
      this.selectingSongCategory.project = project;
      return;
    }
    this.databaseService.subscribeToProjectIfOwner(project);
    this.sharedService.setNavigatedFrom('/collections/' + this.collectionName);
    this.navCtrl.navigateForward('project/' + project.id);
  }

  more() {
    this.presentActionSheet();
  }

  async presentActionSheet() {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const buttons = [];
    let noProjects = true;
    this.projects.forEach(project => {
      if (!project.dontShow) {
        noProjects = false;
      }
    });
    const editCssClass = this.collectionId === 'ALL' && noProjects
    ? 'collectios-more-action-sheet-edit-button' : '';
    buttons[0] = {
        text: 'Edit Collection',
        cssClass: editCssClass,
        handler: () => {
          if (this.collectionId === 'ALL') {
            this.editAllCollection();
          } else {
            this.editCollection();
          }
        }
      };
    buttons[1] = {
        text: 'Add to Collection',
        handler: () => {
          this.addToCollection();
        }
      };
    buttons[2] = {
        text: 'Create Project',
        handler: () => {
          this.createProject();
        }
      };
    buttons[3] = {
        text: 'Cancel',
        handler: () => {
        }
      };

    if (this.collectionId === 'ALL') {
      buttons.splice(1, 1);
    }

    this.actionSheet = await this.actionSheetCtrl.create({
      buttons: buttons,
      mode: 'ios',
      cssClass: 'collectios-more-action-sheet'
    });
    this.actionSheet.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
    })
    .catch((error) => {
      this.canPresent = true;
      console.error(error);
    });
    await this.actionSheet.present();
  }

  delete() {
    this.presentAlertConfirm({action: 'deleteCollection'});
  }

  async presentAlertConfirm(deleteAction: DeleteAction) {
    let headerText = 'Delete Collection?';
    let messageText = this.deleteMessageText;
    let cssClass = 'collections-css-class';
    let deleteText = 'Delete';
    if (deleteAction.action === 'removeFromCollection') {
      const txt = this.isOnlyProject ? 'project' : 'projects';
      headerText = 'Remove selected ' + txt + ' from collection?';
      const txt2 = this.isOnlyProject ? txt + ' is' : txt + ' are';
      messageText = 'This will only remove ' + txt + ' from collection. Actual ' + txt2 + ' in your library';
      deleteText = 'Remove';
    } else if (deleteAction.action === 'deleteProjects') {
      const txt = this.isOnlyProject ? 'project' : 'projects';
      headerText = 'Are you sure you want to delete selected ' + txt + '?';
      messageText = 'Will be permanently deleted from you\'r library and from all related collections!';
      cssClass = 'collections-delete-projects-css-class';
    }
    this.alertAction = await this.alertCtrl.create({
      header: headerText,
      message: messageText,
      mode: 'ios',
      cssClass: cssClass,
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: deleteText,
          cssClass: 'collections-delete-css-class',
          handler: () => {
            if (deleteAction.action === 'deleteCollection') {
              this.deleteCollection();
            } else if (deleteAction.action === 'removeFromCollection') {
              this.removeFromCollection();
            } else if (deleteAction.action === 'deleteProjects') {
              this.deleteSelectedProjects();
            }
          }
        }
      ]
    });

    await this.alertAction.present();
  }

  deleteCollection() {
    this.deleteCollectionFromDB();
    this.projects.forEach(project => {
      const collections = project.collections.filter( (id) => {
        return id !== this.collectionId;
      });
      const data = {collections: collections};
      project.collections = collections;
      this.databaseService.updateProjectFields(project, data).catch((error) => {
        console.error(error);
      });
    });
    this.navCtrl.navigateBack('/library');
  }

  deleteCollectionFromDB() {
    if (this.collectionId !== 'ALL') {
      this.databaseService.deleteCollection(this.collectionId)
      .then(() => {
        this.analyticsService.sendRemoveCollectionEvent();
      })
      .catch((error) => {
        console.error(error);
      });
    }
  }

  editAllCollection() {
    this.manageCollectionText = 'Edit Collection';
    this.editModeDeleteText = 'Delete';
    this.isEditMode = true;
    this.isEditAllMode = true;
    this.isAddToCollection = false;
    this.goUp();
    this.markForCheck();
  }

  editCollection(text?: string) {
    this.manageCollectionText = text || 'Edit Collection';
    this.editModeDeleteText = this.collectionId === 'ALL' ? 'Delete' : 'Remove';
    if (this.isAddToCollection) {
      this.reloadCollection(false);
      this.reset();
    }
    this.isEditMode = true;
    this.isAddToCollection = false;
    this.goUp();
    this.markForCheck();
  }

  addToCollection() {
    this.manageCollectionText = 'Add to Collection';
    this.checkMenuText = 'Select projects to add to collection';
    if (!this.isAddToCollection) {
      this.reloadCollection(true);
      this.reset();
    }
    this.isAddToCollection = true;
    this.isEditMode = false;
    this.goUp();
    if (this.projects && this.projects.length > 50) {
      setTimeout(() => {
        this.markForCheck();
      }, 150);
    } else {
      this.markForCheck();
    }
  }

  createProject() {
    const collectionId = this.collectionId === 'ALL' ? null : this.collectionId;
    this.sharedService.setNavigatedFrom('/collections/' + this.collectionName);
    this.createProjectService.gotoCreateProject(collectionId);
  }

  inputId(event) {
    this.newCollectionName = event.detail.value;
    this.checkIfCanSave();
  }

  toggleSelectedItem(event, project: Project) {
    const isSelected = event.detail.checked;
    const curr = this.projectsToSelect.get(project);
    if (curr === isSelected) {
      return;
    }
    this.projectsToSelect.set(project, isSelected);
    if (this.isAddToCollection) {
      this.checkIfCanSave();
    } else {
      this.checkIfCanEditCollections();
    }
  }

  checkIfCanSave() {
    this.canSave = false;

    if (this.isAddToCollection) {
      this.projectsToSelect.forEach((isSelected) => {
        if (isSelected) {
          this.canSave = true;
        }
      });
      return ;
    }

    if (this.newCollectionName.trim() !== this.collectionName) {
      this.canSave = true;
    }

    // Dont allow saving empty collection name
    if (this.newCollectionName .trim() === '') {
      this.canSave = false;
    }
  }

  checkIfCanEditCollections() {
    let counter = 0;
    this.canEditCollections = false;
    this.projectsToSelect.forEach((isSelected) => {
      if (isSelected) {
        this.canEditCollections = true;
        counter++;
      }
    });

    if (counter === this.projects.length) {
      this.isSelectAll = true;
      this.selectAllText = 'Deselect All';
    } else {
      this.isSelectAll = false;
      this.selectAllText = 'Select All';
    }
  }

  toggleSelectAll() {
    setTimeout(() => {
      this.isSelectAll = !this.isSelectAll;
      this.selectAllText = this.isSelectAll ? 'Deselect All' : 'Select All';
      this.canEditCollections = this.isSelectAll;
      this.projects.forEach((project) => {
        this.projectsToSelect.set(project, this.isSelectAll);
      });
      this.markForCheck();
    }, 0);
  }

  cancel() {
    if (this.isAddToCollection) {
      this.reloadCollection(false);
    }
    this.reset();
    this.goUp();
  }

  reset() {
    this.newCollectionName = this.collectionName;
    this.isAddToCollection = false;
    this.isEditMode = false;
    this.isEditAllMode = false;
    this.isAddToCollection = false;
    this.isSelectAll = false;
    this.selectAllText = this.isSelectAll ? 'Deselect All' : 'Select All';
    this.canSave = false;
    this.canEditCollections = false;
    this.projectsToSelect = new Map<Project, boolean>();
    this.isEditProject = false;
    this.editProject = null;
    this.isOnlyProject = false;
  }

  saveOnEnter(event) {
    if (event.keyCode === 13) {
      this.save();
    }
  }

  save() {
    if (this.isAddToCollection) {
      this.saveCollections();
      return ;
    }

    if (this.canSave) {
      const name = this.newCollectionName.trim();
      const data = {name: name};
      this.databaseService.updateCollection(this.collectionId, data).catch((error) => {
        console.error(error);
      });
      this.collectionName = name;
      this.reset();
      this.goUp();
    }
  }

  saveCollections() {
    this.projects.forEach((project) => {
      const isSelected = this.projectsToSelect.get(project);
      if (this.isEditMode && isSelected !== undefined && !isSelected) {
        const collections = project.collections.filter( (id) => {
          return id !== this.collectionId;
        });
        const data = {collections: collections};
        project.collections = collections;
        this.databaseService.updateProjectFields(project, data).catch((error) => {
          console.error(error);
        });
      } else if (this.isAddToCollection && isSelected) {
        const collections = project.collections;
        collections.push(this.collectionId);
        const data = {collections: collections};
        project.collections = collections;
        this.databaseService.updateProjectFields(project, data).catch((error) => {
          console.error(error);
        });
      }
    });
    if (this.isAddToCollection) {
      this.reloadCollection(false);
    }
    this.reset();
    this.goUp();
  }

  getOffset() {
    return this.projects && this.projects.length > 0 ? this.projects[this.projects.length - 1].name : null;
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  gotoSearchBar() {
    this.isActiveSearchButton = true;
  }

  cancelSearch() {
    this.searchText = '';
    this.isActiveSearchButton = false;
  }

  search(event) {
    const value = event.detail.value;
    this.searchText = value;
  }

  goUp() {
    this.cancelSearch();
    this.viewport.scrollToIndex(0);
  }

  async presentManageCollectionModal(action: string) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;
    let count = 0;
    let project: Project;
    this.projectsToSelect.forEach((isSelected, proj) => {
      if (isSelected) {
        project = proj;
        count++;
      }
    });
    const  projectCollections = count === 1 && action === 'add' ? project.collections : [];
    const modal = await this.modalCtrl.create({
      component: ManageCollectionComponent,
      componentProps: {action: action, onlyProject: projectCollections},
      cssClass: 'manage-collection-modal',
      mode: 'ios'
    });

    modal.onDidDismiss()
      .then((res) => {
        if (res && res.data && res.data.shouldUpdateCollections) {
          const ids = res.data.ids;
          if (action === 'add') {
            this.addSelectedUpdateDb(ids);
          } else {
            this.moveSelectedUpdateDb(ids);
          }
        } else if (res && res.data && res.data.shouldUpdate) {
          const newCollectionId = this.databaseService.createId();
          this.databaseService.createNewCollection(res.data.name, newCollectionId)
          .catch((error) => {
            console.error(error);
          });
          this.addSelectedUpdateDb([newCollectionId]);
        }
        this.canPresent = true;
      })
      .catch((error) => {
        this.canPresent = true;
        console.error(error);
      });

      return await modal.present();
  }

  addSelected() {
    this.presentManageCollectionModal('add');
  }

  moveSelected() {
    this.presentManageCollectionModal('move');
  }

  addSelectedUpdateDb(selectedCollectionsIds: string[]) {
    this.projectsToSelect.forEach((isSelected, project) => {
      if (isSelected) {
        const collections = project.collections;
        selectedCollectionsIds.forEach((id) => {
          if (!collections.includes(id)) {
            collections.push(id);
          }
        });
        const data = {collections: collections};
        this.databaseService.updateProjectFields(project, data).catch((error) => {
          console.error(error);
        });
      }
    });
    this.reset();
    this.goUp();
  }

  moveSelectedUpdateDb(selectedCollectionsIds: string[]) {
    this.projectsToSelect.forEach((isSelected, project) => {
      if (isSelected) {
        const collections = [];
        selectedCollectionsIds.forEach((id) => {
          collections.push(id);
        });
        project.collections = collections;
        const data = {collections: collections};
        this.databaseService.updateProjectFields(project, data).catch((error) => {
          console.error(error);
        });
      }
    });
    this.reset();
    this.goUp();
  }

  deleteSelected() {
    let action: DeleteAction;
    if (this.collectionId === 'ALL') {
      // Delete selected projects
      action = {action: 'deleteProjects'};
    } else {
      // Remove selected projects from collection
      action = {action: 'removeFromCollection'};
    }
    this.presentAlertConfirm(action);
  }

  deleteSelectedProjects() {
    this.projectsToSelect.forEach((isSelected, project) => {
      if (isSelected) {
        this.databaseService.deleteProject(project).catch((error) => {
          console.error(error);
        });
      }
    });
    this.reset();
    this.goUp();
  }

  removeFromCollection() {
    this.projectsToSelect.forEach((isSelected, project) => {
      if (isSelected) {
        const collections = project.collections.filter(id => id !== this.collectionId);
        const data = {collections: collections};
        this.databaseService.updateProjectFields(project, data).catch((error) => {
          console.error(error);
        });
      }
    });
    this.reset();
    this.goUp();
  }

  toggleSortByFilter() {
    this.sortByFilter++;
    let name = SortBy[this.sortByFilter];
    if (!name) {
      this.sortByFilter = 0;
      name = SortBy[this.sortByFilter];
    }
    this.sortByFilterStr = name;
  }

  projectMoreOptions(project: Project) {
    const isDeleted = this.collectionId === 'ALL' ? true : false;
    this.projectOptionsService.moreOptionsForCollectionsPage(project, isDeleted);
  }

  setEditProjectMode(project: Project) {
    this.isOnlyProject = true;
    this.isEditProject = true;
    this.editProject = project;
    this.projectsToSelect.set(project, true);
    this.checkIfCanEditCollections();
    this.editCollection('Edit Project');
  }

  alarmIndicationEvent(event) {
    this.markForCheck();
  }

  doneSelectingSongCategory() {
    if (this.selectingSongCategory) {
      this.selectingSongCategory.isSelecting = false;
    }
    this.tasksService.selectingSongCategorySubject.next(this.selectingSongCategory);
    // goto tasks/category
    this.navCtrl.navigateForward('activity');
  }

  cancelSelectingSongCategory() {
    if (this.selectingSongCategory) {
      this.selectingSongCategory.isSelecting = false;
      this.selectingSongCategory.project = null;
    }
    this.tasksService.selectingSongCategorySubject.next(this.selectingSongCategory);
  }

  ngOnDestroy() {
    if (this._projects) {
      this._projects.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._editProject) {
      this._editProject.unsubscribe();
    }
    if (this._selectingSongCategory) {
      this._selectingSongCategory.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
