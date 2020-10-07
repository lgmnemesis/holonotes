import { Component, OnInit, OnDestroy, Input, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { Category, Task } from '../../../interfaces/task';
import { fade, heightDownChangeState, translateYUp } from '../../../models/animations';
import { TasksService } from '../../../services/tasks.service';
import { Subscription } from 'rxjs';
import { CategoryComponent } from '../category/category.component';
import { SortBy } from '../../../enums/sort-by';

@Component({
  selector: 'app-task-categories',
  templateUrl: './task-categories.component.html',
  styleUrls: ['./task-categories.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    heightDownChangeState,
    translateYUp
  ]
})
export class TaskCategoriesComponent implements OnInit, OnDestroy {

  @Input() taskCategories: Category[] = [];
  @Input() isNewTask = false;
  @Input() task: Task = null;

  categories: Category[] = [];
  _allCategories: Subscription;
  isSearchBarFocused = false;
  searchText = '';
  showAddCategory = false;
  title = 'Categories';
  sortByName = SortBy.Title;

  constructor(private modalCtrl: ModalController,
    private tasksService: TasksService,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this._allCategories = this.tasksService.getAllCategoriesAsObservable().subscribe((categories) => {
      this.categories = categories;
      this.markForCheck();
    });
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  reorder(event) {
    const from = event.detail.from;
    const to = event.detail.to;
    if (from > -1 && to > -1) {
      try {
        const search = this.searchText.toLowerCase();
        const sorted = this.taskCategories.filter((c) => {
          return search === '' || c.name.toLowerCase().includes(search);
        });
        if (sorted[from] && sorted[to]) {
          const fromId = sorted[from].id;
          const toId = sorted[to].id;
          const fromIndex = this.taskCategories.findIndex(c => c.id === fromId);
          const toIndex = this.taskCategories.findIndex(c => c.id === toId);
          if (fromIndex > -1 && toIndex > -1) {
            const moved = this.taskCategories.splice(fromIndex, 1)[0];
            this.taskCategories.splice(toIndex, 0, moved);
            const copy = [...this.taskCategories];
            this.taskCategories = copy;
            this.markForCheck();
          }
        }
        event.detail.complete();
      } catch (error) {
        event.detail.complete();
        console.error(error);
      }
    }
  }

  setSearchBarFocused(isFocus: boolean) {
    this.isSearchBarFocused = isFocus;
  }

  search(event) {
    const value = event.detail.value;
    this.searchText = value;
    this.showAddCategory = value.trim() !== '';
  }

  addCategory() {
    const modalOptions = {
      component: CategoryComponent,
      componentProps: {
        categories: this.categories,
        newCategoryName: this.searchText
      },
      cssClass: 'category-component-modal',
      mode: 'ios'
    };
    this.presentModal(modalOptions);
  }

  async presentModal(modalOptions: any) {
    const modal = await this.modalCtrl.create(modalOptions);

    modal.onDidDismiss()
    .then((res) => {
      if (res && res.data) {
        if (res.data.newCategory && !res.data.canEdit) {
          const category = res.data.newCategory;
          this.markCategory(category, true);
          const localCategories = this.tasksService.getLocalCategories();
          localCategories.push(category);
          this.tasksService.saveLocalCategories(localCategories);
        } else if (res.data.newCategory && res.data.canEdit) {
          const category = res.data.newCategory;
          const localCategories = this.tasksService.getLocalCategories();
          const index = localCategories.findIndex(c => c.id === category.id);
          if (index > -1) {
            localCategories[index] = category;
            this.tasksService.saveLocalCategories(localCategories);

            // Update taskCategories if needed
            const tIndex = this.taskCategories.findIndex(c => c.id === category.id);
            if (tIndex > -1) {
              const copy = [...this.taskCategories];
              copy[tIndex] = category;
              this.taskCategories = copy;
            }
            this.markForCheck();
          }
        } else if (res.data.isCategoryModal && res.data.closeParent) {
          setTimeout(() => {
            this.close(true);
          }, 0);
        } else if (res.data.deletedCategory) {
          const category = res.data.deletedCategory;
          this.markCategory(category, false);
        }
      }
    })
    .catch(error => {
      console.error(error);
    });

    return await modal.present().then(() => {
    });
  }

  openCategory(category: Category) {
    const modalOptions = {
      component: CategoryComponent,
      componentProps: {
        task: this.task,
        category: category,
        categories: this.categories
      },
      cssClass: 'category-component-modal',
      mode: 'ios'
    };
    this.presentModal(modalOptions);
  }

  toggleChecked(event, category: Category) {
    this.markCategory(category, event.detail.checked);
  }

  markCategory(category: Category, isChecked: boolean) {
    if (isChecked) {
      const copy = [...this.taskCategories];
      copy.push(category);
      this.taskCategories = copy;
    } else {
      this.taskCategories = this.taskCategories.filter(c => c.id !== category.id);
    }
    this.markForCheck();
  }

  cancel() {
    this.close();
  }

  close(closeParent?: boolean) {
    const data = {
      shouldUpdateCategories: !this.isNewTask,
      taskCategories: this.taskCategories,
      closeParent: closeParent
    };
    this.modalCtrl.dismiss(data).catch(error => console.error(error));
  }

  trackById(i: number, category: Category) {
    return category.id;
  }

  ngOnDestroy() {
    if (this._allCategories) {
      this._allCategories.unsubscribe();
    }
  }
}
