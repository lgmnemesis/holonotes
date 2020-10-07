import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NewProjectViews } from '../../enums/new-project-views';
import { Router, ActivatedRoute } from '@angular/router';
import { SharedStoreService } from '../../services/shared-store.service';
import { CreateProjectService } from '../../services/create-project.service';
import { LoadingController } from '@ionic/angular';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.page.html',
  styleUrls: ['./create-project.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProjectPage implements OnInit {

  canPresent = true;
  view = NewProjectViews;
  currentView: NewProjectViews;
  loadingSpinner: HTMLIonLoadingElement;

  constructor(private sharedStoreService: SharedStoreService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private createProjectService: CreateProjectService,
    private loadingCtrl: LoadingController,
    private analyticsService: AnalyticsService) {}

  ngOnInit() {
    const id = this.activatedRoute.snapshot.paramMap.get('id');
    try {
      this.currentView = Number.parseInt(id, 10);
    } catch (error) {
    }
    this.sharedStoreService.createNewProjectStore();
    const collectionId = this.createProjectService.fromCollectionId;
    if (collectionId) {
      const collections = [];
      collections.push(collectionId);
      this.sharedStoreService.getNewProjectStore().collections = collections;
    }
  }

  next(nextView: NewProjectViews) {
    if (nextView === NewProjectViews.None) {
      this.headerBack();
    } else if (nextView === NewProjectViews.Finish) {
      this.finish();
    } else {
      this.sharedStoreService.previousViews.push(this.currentView);
      this.navigateTo(nextView);
    }
  }

  finish() {
    const project = this.sharedStoreService.getNewProjectStore();
    this.presentLoading().then(() => {
      this.createProjectService.createProject(project).then(() => {
        this.analyticsService.sendAddProjectEvent();
        this.loadingSpinner.dismiss()
        .then(() => {
          this.sharedStoreService.createNewProjectStore();
        })
        .catch((error) => {
          console.error(error);
        });
      });
    });
  }

  headerBack() {
    this.navigateByUrl(this.sharedStoreService.newProjectFromUrl);
  }

  back() {
    this.navigateTo(this.sharedStoreService.previousViews.pop());
  }

  private navigateTo(nextView: NewProjectViews) {
    this.navigateByUrl(`/create-project/${nextView}`);
  }

  private navigateByUrl(url: string) {
    this.router.navigateByUrl(url)
    .catch((error) => {
      console.error(error);
    });
  }

  async presentLoading() {
    this.loadingSpinner = await this.loadingCtrl.create({
      spinner: 'bubbles',
      message: 'Loading Project...',
      mode: 'ios',
      translucent: true
    });
    return await this.loadingSpinner.present();
  }
}
