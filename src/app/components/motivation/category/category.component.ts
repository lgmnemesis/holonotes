import { Component, OnInit, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, ActionSheetController, NavController } from '@ionic/angular';
import { TasksService } from '../../../services/tasks.service';
import { TaskStarted, Category, Task } from '../../../interfaces/task';
import { fade } from '../../../models/animations';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Project } from '../../../interfaces/project';
import { SharedService } from '../../../services/shared.service';
import { TasksSchedulerService } from '../../../services/tasks-scheduler.service';

@Component({
  selector: 'app-category',
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade
  ]
})
export class CategoryComponent implements OnInit {

  @Input() task: Task = null;
  @Input() category: Category = null;
  @Input() categories: Category[] = [];
  @Input() taskStarted: TaskStarted = null;
  @Input() newCategoryName = '';
  @Input() project: Project = null;

  isLocalCategory = false;
  isTaskStarted = false;
  isNewCategory = false;
  canEdit = false;
  canPresent = true;
  origName = '';
  origDescription = '';
  origDuration = '';
  isActiveCategory = false;
  inProjectPage = false;

  newCategory: Category = null;
  title = '';
  canSave = false;
  inputError = '';
  selectedSongCategoryName = '';

  constructor(private modalCtrl: ModalController,
    private tasksService: TasksService,
    private actionSheetCtrl: ActionSheetController,
    private router: Router,
    private authService: AuthService,
    private sharedService: SharedService,
    private tasksSchedulerService: TasksSchedulerService,
    private navCtrl: NavController,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.isTaskStarted = this.taskStarted ? true : false;
    if (this.category) {
      this.title = this.category.name;
      this.isLocalCategory = !this.category.is_global;
      this.newCategory = {...this.category};
      this.origName = this.newCategory.name;
      this.origDescription = this.newCategory.description;
      this.origDuration = this.newCategory.duration;
      this.inProjectPage =  this.router.url === `/project/${this.category.project_id}`;
    }
    if (this.newCategoryName !== '') {
      this.newCategory = this.tasksService.createCategory();
      this.newCategory.name = this.newCategoryName;
      this.isNewCategory = true;
      this.checkIfCanSave();
    }
    this.canEdit = this.isLocalCategory
      && this.categories.length > 0 && !this.isTaskStarted && !this.isNewCategory;

    if (this.project) {
      this.title = `Work on ${this.project.name}`;
      this.selectedSongCategoryName = this.title;
      this.newCategory.name = this.title;
      this.canSave = true;
      this.categories = this.tasksService.getAllCategories();
      this.tasksService.selectingSongCategorySubject.next(null);
      this.checkIfCanSave();
    }

    if (this.tasksSchedulerService.taskStarted && this.category) {
      this.isActiveCategory =
        this.category.id === this.tasksSchedulerService.taskStarted.categoryId;
    }
  }

  inputId(event) {
    if (this.newCategory) {
      this.newCategory.name = event.detail.value;
      this.checkIfCanSave();
    }
  }

  inputSelectedSongCategoryName(event) {
    if (this.project) {
      this.selectedSongCategoryName = event.detail.value;
      this.title = this.selectedSongCategoryName;
      this.newCategory.name = this.title;
      this.checkIfCanSave();
    }
  }

  descriptionInput(event) {
    if (this.newCategory) {
      this.newCategory.description = event.detail.value;
      this.checkIfCanSave();
    }
  }

  checkIfCanSave() {
    const unique = this.isUniqueCategoryName(this.newCategory.name);
    this.canSave = this.newCategory &&
      this.newCategory.name &&
      this.newCategory.name.trim() !== '' &&
      (unique || this.newCategory.name === this.origName) &&
      (!this.canEdit || (this.canEdit &&
        (this.newCategory.name.trim() !== this.origName ||
          this.newCategory.description.trim() !== this.origDescription ||
          this.newCategory.duration !== this.origDuration)));

    if ((this.isNewCategory || this.canEdit || this.project)  &&
      (!unique && this.newCategory.name !== this.origName)) {
      this.inputError = 'Category name already in use';
    } else {
      this.inputError = '';
    }
    this.cd.markForCheck();
  }

  isUniqueCategoryName(name: string) {
    const tName = name ? name.trim() : name;
    return this.categories.filter(category => category.name === tName).length === 0;
  }

  getPickerOptions() {
    return {
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          handler: () => {
          }
        },
        {
          text: 'Done',
          handler: (res) => {
            this.newCategory.duration = `${res.hour.text}:${res.minute.text}`;
            this.checkIfCanSave();
          }
        }
      ]
    };
  }

  delete() {
    const buttons = [];
    buttons[0] = {
      text: 'Delete Category',
      cssClass: 'action-sheet-delete-button',
      handler: () => {
        const localCategories = this.tasksService.getLocalCategories()
          .filter((category) => {
            return category.id !== this.category.id;
          });
        this.tasksService.saveLocalCategories(localCategories);
        this.close({deletedCategory: this.category});
      }
    };
    buttons[1] = {
      text: 'Cancel',
      handler: () => {
      }
    };
    this.presentActionSheet(buttons);
  }

  async presentActionSheet(buttons: any[]) {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const actionSheet = await this.actionSheetCtrl.create({
      buttons: buttons,
      mode: 'ios',
      cssClass: 'collectios-more-action-sheet'
    });
    actionSheet.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
    })
    .catch((error) => {
      this.canPresent = true;
      console.error(error);
    });
    await actionSheet.present();
  }

  selectFromLibrary() {
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl('/library')
      .catch((error) => {
        console.error(error);
      });
      this.close({closeParent: true});
      this.tasksService.selectingSongCategorySubject.next({
        isSelecting: true,
        project: null,
        task: this.task,
        category: this.category
      });
    }
  }

  gotoProject() {
    const db = this.tasksService.databaseService;
    const id = this.category.project_id;
    db.subscribeToProjectById(id);
    if (this.sharedService._currentProject) {
      this.sharedService._currentProject.unsubscribe();
    }
    this.sharedService._currentProject =
      this.sharedService.currentProject$.subscribe((project) => {
      if (project) {
        this.gotoProjectById(id);
        this.sharedService._currentProject.unsubscribe();
      }
    });
    this.close({playAndCloseParent: true, category: this.category});
  }

  gotoProjectById(id: string) {
    this.navCtrl.navigateRoot(`/project/${id}`)
    .catch((error) => {
      console.error(error);
    });
  }

  cancel() {
    this.newCategory = null;
    this.modalCtrl.dismiss().catch(error => console.error(error));
  }

  close(data?: any) {
    const defData = {
      isCategoryModal: true,
      newCategory: this.newCategory,
      canEdit: this.canEdit
    };
    if (this.project) {
      data = {project: this.project, name: this.selectedSongCategoryName};
    }
    const all = data ? {...data, ...defData} : defData;
    if (!this.canSave) {
      all.newCategory = null;
    }
    this.modalCtrl.dismiss(all).catch(error => console.error(error));
  }
}
