import { BehaviorSubject, Observable } from 'rxjs';

export interface BatchScroll {
  for: 'projectsFromCollection' | 'allProjects' | 'projectsForFeed' | 'projectsForFeedSearch' | 'library';
  collectionId?: string;
  batchSize?: number;
  isEnd?: boolean;
  lastSeen?: any;
  offsetTrigger?: number;
  search?: string;

  offset?: BehaviorSubject<any>;
  infinite?: Observable<any[]>;
  isLocked?: boolean;
}
