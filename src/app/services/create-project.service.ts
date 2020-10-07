import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Project } from '../interfaces/project';
import { AuthService } from './auth.service';
import { SharedStoreService } from './shared-store.service';
import { Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { NewProjectViews } from '../enums/new-project-views';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class CreateProjectService {

  fromCollectionId: string = null;

  constructor(private databaseService: DatabaseService,
      private authService: AuthService,
      private sharedStoreService: SharedStoreService,
      private router: Router,
      private navCtrl: NavController) { }

  gotoCreateProject(fromCollectionId: string = null) {
    this.fromCollectionId = fromCollectionId;
    this.sharedStoreService.newProjectFromUrl = this.router.url;
    this.navCtrl.navigateForward(`/create-project/${NewProjectViews.NameAndURL}`);
  }

  async createProject(data: Project) {

    const { name, artist, videos, collections } = data;
    const project = this.newProject(collections);

    project.name = name || '';
    project.artist = artist || '';
    project.videos = videos || [];

    project.name = project.name.trim();
    project.artist = project.artist.trim();

    if (videos && videos.length > 0) {
      project.cover_img = videos[0].thumbnail_url;
    }
    const user = this.authService.user;
    if (user) {
      project.author_name = user.display_name;
    }

    await this.createNewProjectInDB(project);
    return await this.gotoProject(project);
  }

  private async createNewProjectInDB(project: Project) {
    return await this.databaseService.createNewProject(project)
     .catch((error) => {
      console.error(error);
    });
  }

  private newProject(collections?: string[]): Project {
    const project = this.sharedStoreService.newDefaultProjectObj();
    project.collections = collections || [];
    return project;
  }

  private async gotoProject(project: Project) {
    this.databaseService.subscribeToProjectIfOwner(project);
    return await this.navCtrl.navigateForward('project/' + project.id);
  }
}
