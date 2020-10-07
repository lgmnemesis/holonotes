import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { BatchScroll } from '../interfaces/batchScroll';
import { InfiniteScrollingService } from './infinite-scrolling.service';
import { LibraryCollection } from '../interfaces/library';
import { Subscription, BehaviorSubject } from 'rxjs';
import { Project } from '../interfaces/project';

@Injectable({
  providedIn: 'root'
})
export class DataStoreService {

  _libraryCollections: Subscription;
  libraryCollections: LibraryCollection[];
  libraryChangeSubject = new BehaviorSubject('');
  libraryChange$ = this.libraryChangeSubject.asObservable();

  _libraryAllProjects: Subscription;
  libraryAllProjects: Project[];
  libraryAllProjectsChangeSubject = new BehaviorSubject(null);
  libraryAllProjectsChange$ = this.libraryAllProjectsChangeSubject.asObservable();

  libraryBatchParams: BatchScroll;

  constructor(private sharedService: SharedService,
    private infiniteScrollingService: InfiniteScrollingService) { }

  registerToLibraryCollectios(isForce?: boolean) {
    if (!this._libraryCollections || isForce) {
      let batchParams: BatchScroll = {
        for: 'library',
        batchSize: this.sharedService.getMaxProjectsToShow(),
        isEnd: true
      };

      this.unRegisterToLibraryCollectios();
      batchParams = this.infiniteScrollingService.init(batchParams);
      this.libraryBatchParams = batchParams;

      this._libraryCollections = batchParams.infinite.subscribe((collections) => {
        this.libraryCollections = collections;
        this.libraryChangeSubject.next('true');
      });
    }
    return this.libraryChange$;
  }

  unRegisterToLibraryCollectios() {
    if (this._libraryCollections) {
      this._libraryCollections.unsubscribe();
    }
  }

  registerToLibraryAllProjects(isForce?: boolean) {
    if (!this._libraryAllProjects || isForce) {
      let batchParams: BatchScroll = {
        for: 'allProjects',
        batchSize: this.sharedService.getMaxProjectsToShow()
      };

      this.unRegisterToLibraryAllProjects();
      batchParams = this.infiniteScrollingService.init(batchParams);
      this.libraryBatchParams = batchParams;

      this._libraryAllProjects = batchParams.infinite.subscribe((projects) => {
        this.libraryAllProjects = projects;
        this.libraryAllProjectsChangeSubject.next('true');
      });
    }
    return this.libraryAllProjectsChange$;
  }

  unRegisterToLibraryAllProjects() {
    if (this._libraryAllProjects) {
      this._libraryAllProjects.unsubscribe();
    }
  }
}
