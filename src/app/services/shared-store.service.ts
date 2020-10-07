import { Injectable } from '@angular/core';
import { NewProjectViews } from '../enums/new-project-views';
import { Project } from '../interfaces/project';
import { DatabaseService } from './database.service';

@Injectable({
  providedIn: 'root'
})
export class SharedStoreService {

  private newProjectStore: Project;
  newProjectFromUrl: string;
  previousViews: NewProjectViews[] = [];

  constructor(private databaseService: DatabaseService) { }

  createNewProjectStore() {
    this.newProjectStore = this.newDefaultProjectObj();
  }

  newDefaultProjectObj(): Project {
    const id = this.databaseService.createProjectIdHash();
    const collections = [];
    const project: Project = {
      id: id,
      name: '',
      author_name: '',
      source_player: {
        video_url: 'initial',
        video_type: 'youtube'
      },
      lesson_player: {
        video_url: 'initial',
        video_type: 'youtube'
      },
      bookmarks: [],
      videos: [],
      collections: collections,
      user_id: this.databaseService.getMyUserId(),
      showInstructions: true,
      is_public: false,
      cover_img: '',
      preview_description: ''
    };

    return project;
  }

  getNewProjectStore() {
    return this.newProjectStore;
  }
}
