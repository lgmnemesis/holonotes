import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { Observable, of, Subscription } from 'rxjs';
import isEqual from 'lodash.isequal';
import { LibraryCollection } from '../interfaces/library';
import { Project } from '../interfaces/project';
import { Message, Chat } from '../interfaces/message';
import { AuthService } from './auth.service';
import { SharedService } from './shared.service';
import { tap, map, catchError, take } from 'rxjs/operators';
import { BatchScroll } from '../interfaces/batchScroll';
import { Task, Category, Challenge } from '../interfaces/task';
import { environment } from '../../environments/environment';
import { History } from '../interfaces/journy-history';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private afs: AngularFirestore,
    private auth: AuthService,
    private sharedService: SharedService) {
  }

  private getLibraryDbRef(batchSize: number, lastSeen: string = null): AngularFirestoreCollection<LibraryCollection> {
    const path = 'library/' + this.auth.user.user_id + '/collections';
    return this.afs.collection(path, ref => {
      return ref.orderBy('name')
      .startAfter(lastSeen)
      .limit(batchSize);
    });
  }

  getLibraryCollectionsAsObservable(bs: BatchScroll): Observable<any> {
    const ref = this.getLibraryDbRef(bs.batchSize, bs.lastSeen);
    return this.getBatch(ref, bs)
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  private getProjectsForFeedDbRef(batchSize: number, lastSeen): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    return this.afs.collection(path, ref => {
      return ref.where('is_public', '==', true)
      .orderBy('timestamp', 'asc') // TODO: order by score (some calculated score? or compound scores?. likes?, genre? )
      .startAfter(lastSeen)
      .limit(batchSize);
    });
  }

  getProjectsForFeedAsObservable(bs: BatchScroll): Observable<any> {
    const ref = this.getProjectsForFeedDbRef(bs.batchSize, bs.lastSeen);
    return this.getBatch(ref, bs)
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  private getRecentlyAddedProjectsDbRef(limit: number): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    return this.afs.collection(path, ref => {
      return ref.where('is_public', '==', true)
      .orderBy('timestamp', 'asc') // TODO: order by score (some calculated score? or compound scores?. likes?, genre? )
      .limit(limit);
    });
  }

  getRecentlyAddedProjectsAsObservable(limit = 10): Observable<Project[]> {
    return this.getRecentlyAddedProjectsDbRef(limit).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of([]);
    }));
  }

  private getMyProjectsDbRef(limit: number): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    const userId = this.getMyUserId();
    return this.afs.collection(path, ref => {
      return ref.where('user_id', '==', userId)
      .orderBy('timestamp', 'asc')
      .limit(limit);
    });
  }

  getMyProjectsAsObservable(limit = 5): Observable<Project[]> {
    return this.getMyProjectsDbRef(limit).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  private getProjectsForFeedSearchDbRef(search: string, batchSize: number,
    lastSeen = null): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    return this.afs.collection(path, ref => {
      return ref
      .where('is_public', '==', true)
      .where('search_tags', 'array-contains', search)
      .orderBy('timestamp', 'asc')
      .startAfter(lastSeen)
      .limit(batchSize);
    });
  }

  getProjectsForFeedSearchAsObservable(bs: BatchScroll): Observable<any> {
    const ref = this.getProjectsForFeedSearchDbRef(bs.search, bs.batchSize, bs.lastSeen);
    return this.getBatch(ref, bs)
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  private getProjectsFromCollectionDbRef(
    collectionId: string, batchSize: number, lastSeen = null): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    const userId = this.getMyUserId();
    return this.afs.collection(path, ref => {
      return ref.where('user_id', '==', userId)
      .where('collections', 'array-contains', collectionId)
      .orderBy('name')
      .startAfter(lastSeen)
      .limit(batchSize);
    });
  }

  private getProjectsDbRef(batchSize: number, lastSeen = null): AngularFirestoreCollection<Project> {
    const path = 'projects/';
    const userId = this.getMyUserId();
    return this.afs.collection(path, ref => {
      return ref.where('user_id', '==', userId)
      .orderBy('name').
      startAfter(lastSeen)
      .limit(batchSize);
    });
  }

  getProjectsAsObservable(bs: BatchScroll): Observable<any> {
    const ref = this.getProjectsDbRef(bs.batchSize, bs.lastSeen);
    return this.getBatch(ref, bs)
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getProjectsFromCollectionAsObservable(bs: BatchScroll): Observable<any> {
     const ref = this.getProjectsFromCollectionDbRef(bs.collectionId, bs.batchSize, bs.lastSeen);
     return this.getBatch(ref, bs)
     .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getProjectAsObservable(projectId: string): Observable<Project> {
    const path = 'projects/' + projectId;
    return this.afs.doc(path).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getSharedChallengesProjectAsObservable(projectId: string): Observable<Project> {
    const path = 'shared_challenges_projects/' + projectId;
    return this.afs.doc(path).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getNewsFeedConfigurationAsObservable(): Observable<any> {
    const path = 'news_feed/configuration';
    return this.afs.doc(path).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getBatchFor(batchParams: BatchScroll) {
    if (batchParams.for === 'projectsFromCollection') {
      return this.getProjectsFromCollectionAsObservable(batchParams);
    } else if (batchParams.for === 'allProjects') {
      return this.getProjectsAsObservable(batchParams);
    } else if (batchParams.for === 'projectsForFeed') {
      return this.getProjectsForFeedAsObservable(batchParams);
    } else if (batchParams.for === 'projectsForFeedSearch') {
      return this.getProjectsForFeedSearchAsObservable(batchParams);
    } else if (batchParams.for === 'library') {
      return this.getLibraryCollectionsAsObservable(batchParams);
    } else {
      return of(null);
    }
  }

  private getBatch(ref: AngularFirestoreCollection<any>, bs: BatchScroll) {
    return ref
    .stateChanges()
    .pipe(
      tap(arr => (arr.length ? null : (bs.isEnd = true))),
      map(arr => {
        return arr.reduce((acc, cur) => {
          const type = cur.payload.type;
          const id = cur.payload.doc.id;
          const data = cur.payload.doc.data();
          if (type === 'removed') {
            data.dontShow = true;
          }
          return { ...acc, [id]: data };
        }, {});
      })
    );
  }

  getChatById(id: string): Observable<{}> {
    const path = `chats/${id}`;
    return this.afs.doc(path).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of({});
    }));
  }

  addMessage(chatId: string, message: Message): Promise<void> {
    const path = 'chats';
    const ref = this.afs.collection(path).doc(chatId);
    return ref.update({ messages: firebase.firestore.FieldValue.arrayUnion(message) });
  }

  addFeedback(feedback: string): Promise<void> {
    const id = this.createId();
    const path = `feedbacks/${id}`;
    const data = { text: feedback };
    return this.afs.doc(path).set(data, { merge: true });
  }

  isSubscribedToProjectById(projectId: string): boolean {
    const cp = this.sharedService.currentProject;
    return this.sharedService._project && cp && cp.id === projectId;
  }

  isSubscribedToProject(project: Project): boolean {
    const cp = this.sharedService.currentProject;
    return this.sharedService._project && cp && cp.id === project.id;
  }

  subscribeToProjectIfOwner(project: Project): Subscription {
    const cp = this.sharedService.currentProject;
    if (this.isProjectOwner(project) &&
      !(this.sharedService._project && cp && cp.id === project.id)) {
        this.sharedService.currentProject = JSON.parse(JSON.stringify(project));
      return this.subscribeToProject(this.sharedService.currentProject);
    }
    this.sharedService.currentProject = JSON.parse(JSON.stringify(project));
    return null;
  }

  isProjectOwner(project: Project): boolean {
    return this.auth.isLoggedIn() && this.auth.user.user_id === project.user_id;
  }

  subscribeToProject(project: Project): Subscription {
    return this.subscribeToProjectById(project.id);
  }

  subscribeToProjectById(id: string): Subscription {
    // Unsubscribe in case alleady subscribed
    this.sharedService.projectUnsubscribe();

    const sub = this.getProjectAsObservable(id)
    .subscribe((proj: Project) => {
      if (proj) {
        this.sharedService.projectLastUpdatedTime = new Date().getMilliseconds();
        const isProjectChanged = !isEqual(proj, this.sharedService.currentProject);
        if (isProjectChanged) {
          this.sharedService.currentProject = proj;
          this.sharedService.updateTimeLineWithMenuMap();
        }
        this.sharedService.currentProjectSub.next(proj);
      }
    });
    this.sharedService._project = sub;
    return sub;
  }

  async updateProjectFields(project: Project, updatedFields): Promise<void> {
    let path = 'projects/';
    path +=  project.id;
    this.sharedService.projectLastUpdatedTime = new Date().getMilliseconds();
    if (!this.isProjectOwner(project)) {
      let credentials = null;
      if (!this.auth.isLoggedIn()) {
        credentials = await this.auth.afAuth.signInAnonymously().catch((error) => {
          console.error(error);
        });
      }
      const id = this.createProjectIdHash();
      path = 'projects/' + id;
      return await this.copyProject(project, id, updatedFields).then(() => {
        project.id = id;
        this.subscribeToProject(project);
        return Promise.resolve();
      }).catch((error) => {
        if (!environment.production) {
          console.error(error);
        }
        return Promise.resolve();
      });
    } else {
      updatedFields.timestamp = this.negativeTimestamp;
      updatedFields.search_tags = this.sharedService.createSearchTagsForProject(project);
      return this.afs.doc(path).update(updatedFields);
    }
  }

  createNewProject(project: Project): Promise<void> {
    const path = 'projects/';
    project.timestamp = this.negativeTimestamp;
    project.search_tags = this.sharedService.createSearchTagsForProject(project);
    return this.afs.collection(path).doc(project.id).set(project);
  }

  copyProject(project: Project, generatedId?: string, updatedFields?: any): Promise<void> {
    const copy = this.copyProjectParams(project, generatedId, updatedFields);
    const path = 'projects/';
    return this.afs.collection(path).doc(copy.id).set(copy);
  }

  private copyProjectParams(project: Project, generatedId?: string, updatedFields?: any): Project {
    let copy: Project = JSON.parse(JSON.stringify(project));
    copy.id = generatedId || this.createProjectIdHash();
    copy.name = project.user_id === this.getMyUserId() ? 'Copy of ' + project.name : project.name;
    // Make sure 'new' project has my user id(in case was copied from other user's project)
    copy.user_id = this.getMyUserId();
    // Make sure 'new' project is not public by default
    copy.is_public = false;
    copy.collections = [];
    copy.timestamp = this.negativeTimestamp;
    if (updatedFields) {
      const combined = { ...copy, ...updatedFields };
      copy = combined;
    }
    return copy;
  }

  deleteProject(project: Project): Promise<void> {
    const path = 'projects/';
    this.sharedService.projectUnsubscribe();
    return this.afs.collection(path).doc(project.id).delete();
  }

  createNewCollection(name: string, givenId?: string): Promise<void> {
    const id = givenId || this.createId();
    const collection: LibraryCollection = {
      id: id,
      name: name,
      collection_description: '',
      timestamp: this.negativeTimestamp
    };
    const path = 'library/' + this.getMyUserId() + '/collections/';
    return this.afs.collection(path).doc(id).set(collection);
  }

  updateCollection(id: string, data: any): Promise<void> {
    const path = 'library/' + this.getMyUserId() + '/collections/';
    return this.afs.collection(path).doc(id).update(data);
  }

  deleteCollection(id: string): Promise<void> {
    const path = 'library/' + this.getMyUserId() + '/collections/';
    return this.afs.collection(path).doc(id).delete();
  }

  private getTasksByUserIdDbRef(id: string, isComplete: boolean, limit: number): AngularFirestoreCollection<Task> {
    const path = `tasks/${id}/tasks/`;
    return this.afs.collection(path, ref => {
      return ref.where('is_completed', '==', isComplete).limit(limit);
    });
  }

  getTasksByUserIdAsObservable(id: string): Observable<Task[]> {
    return this.getTasksByUserIdDbRef(id, false, 50).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  getCompletedTasksByUserIdAsObservable(id: string): Observable<Task[]> {
    return this.getTasksByUserIdDbRef(id, true, 100).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  private getTasksGlobalDbRef() {
    const path = `tasks_global/all`;
    return this.afs.doc(path);
  }

  getTasksGlobalAsObservable(): Observable<any> {
    return this.getTasksGlobalDbRef().valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of({});
    }));
  }

  private getUserTasksDbRef() {
    const uid = this.getMyUserId();
    const path = `tasks/${uid}`;
    return this.afs.doc(path);
  }

  getUserTasksAsObservable(): Observable<any> {
    return this.getUserTasksDbRef().valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  createUserTasksDoc(): Promise<void> {
    return this.getUserTasksDbRef().set({user_id: this.getMyUserId()}, {merge: true});
  }

  updateUserTasksCategories(categories: Category[]): Promise<void> {
    return this.getUserTasksDbRef().set({categories: categories}, {merge: true});
  }

  async createOrSetTask(task: Task, isNew = false): Promise<void> {
    let credentials = null;
    if (!this.auth.isLoggedIn()) {
      credentials = await this.auth.afAuth.signInAnonymously().catch((error) => {
        console.error(error);
      });
    }
    const path = 'tasks/' + this.getMyUserId() + '/tasks';
    const tclone: Task = JSON.parse(JSON.stringify(task));
    if (!tclone.user_id) {
      tclone.user_id = this.getMyUserId();
    }
    tclone.is_active = false;

    const isChallenge = tclone.challenge && tclone.challenge.is_challenge;
    const isNewChallenge = isNew && isChallenge && !tclone.challenge.joined;
    const isUpdatedSharedChallenge = isChallenge && tclone.challenge.is_public &&
      tclone.user_id === this.getMyUserId() &&
      tclone.challenge.updatedFields && tclone.challenge.updatedFields.isUpdated;
    const isJoiningChallenge = isNew && isChallenge && tclone.challenge.joined;

    let updatedFields = null;
    if (tclone.challenge.updatedFields) {
      updatedFields = JSON.parse(JSON.stringify(tclone.challenge.updatedFields));
    }
    delete tclone.challenge.updatedFields; // Reset in db
    if (isNewChallenge || isUpdatedSharedChallenge) {
      const chat: Chat = {
        id: tclone.id,
        admins: [],
        is_public: tclone.challenge.is_public || false,
        participates: [],
        messages: [],
        user_id: this.getMyUserId()
      };
      const cpath = 'chats';
      const spath = 'shared_challenges';
      const ppath = 'shared_challenges_projects';
      const taskDoc = firebase.firestore().doc(`${path}/${tclone.id}`);
      const chatDoc = firebase.firestore().doc(`${cpath}/${tclone.id}`);
      const sharedChallengeDoc = firebase.firestore().doc(`${spath}/${tclone.id}`);
      const batch = firebase.firestore().batch();

      if (isNewChallenge) {
        batch.set(chatDoc, chat);
        if (tclone.challenge.is_public) {
          tclone.challenge.shared_id = tclone.id;
          batch.set(sharedChallengeDoc, tclone);
        }
      } else if (isUpdatedSharedChallenge) {
        if (updatedFields && updatedFields.project) {
          const sharedChallengeProjectsDoc = firebase.firestore().doc(`${ppath}/${updatedFields.project.id}`);
          batch.set(sharedChallengeProjectsDoc, updatedFields.project);
        }
        if (updatedFields && updatedFields.data) {
          batch.set(sharedChallengeDoc, updatedFields.data, {merge: true});
        }
      }
      batch.set(taskDoc, tclone, {merge: true});
      return batch.commit();
    }
    if (isJoiningChallenge) {
      this.createJoinedChallengeCountDoc(tclone.challenge);
      if (tclone.challenge.project) {
        const sharedProject = await this.getSharedChallengesProjectAsObservable(tclone.challenge.project.id).pipe(take(1)).toPromise()
          .catch(error => console.error(error));
        if (sharedProject && sharedProject.user_id !== this.getMyUserId()) {
          const id = this.createProjectIdHash(sharedProject.id);
          this.copyProject(sharedProject, id);
          tclone.challenge.project.id = id;
        }
      }
    }
    return this.afs.collection(path).doc(tclone.id).set(tclone, {merge: true});
  }

  createJoinedChallengeCountDoc(challenge: Challenge): Promise<void> {
    if (!this.getMyUserId() || !challenge.shared_id) {
      return null;
    }
    const path = 'shared_challenges_counters';
    const docId = `${this.getMyUserId()}_${challenge.shared_id}`;
    return this.afs.collection(path).doc(docId).set({user_id: this.getMyUserId(), shared_id: challenge.shared_id})
    .catch(error => {
      if (!environment.production) {
        console.error(error);
      }
    });
  }

  deleteTask(task: Task): Promise<void> {
    const path = 'tasks/' + this.getMyUserId() + '/tasks/';
    return this.afs.collection(path).doc(task.id).delete();
  }

  private getUserHistoryDbRef() {
    const uid = this.getMyUserId();
    const path = `history/${uid}`;
    return this.afs.doc(path);
  }

  getUserHistoryAsObservable(): Observable<History> {
    return this.getUserHistoryDbRef().valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of(null);
    }));
  }

  async updateUserHistory(history: History): Promise<void> {
    if (!history || !history.journey_list) {
      return Promise.reject('history not exists');
    }
    const path = 'history';
    let id = this.getMyUserId();
    if (!id && !this.auth.isLoggedIn()) {
      let credentials = null;
      credentials = await this.auth.afAuth.signInAnonymously().catch((error) => {
        console.error(error);
      });
      id = this.getMyUserId();
      history.user_id = id;
    }
    return !id ? Promise.reject('id is null') : this.afs.collection(path).doc(id).set(history, {merge: true});
  }

  private getSharedChallengeByIdDbRef(id: string) {
    const path = `shared_challenges/${id}`;
    return this.afs.doc(path);
  }

  getSharedChallengeByIdAsObservable(id: string): Observable<any> {
    return this.getSharedChallengeByIdDbRef(id).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of({});
    }));
  }

  private getSharedChallengesDbRef(batchSize): AngularFirestoreCollection<Task> {
    const path = 'shared_challenges/';
    return this.afs.collection(path, ref => {
      return ref.limit(batchSize);
    });
  }

  getSharedChallengesAsObservable(batchSize = 50): Observable<any> {
    return this.getSharedChallengesDbRef(batchSize).valueChanges()
    .pipe(catchError((error) => {
      if (!environment.production) {
        console.error(error);
      }
      return of({});
    }));
  }

  getMyUserId(): string {
    const user = this.auth.user;
    return user ? user.user_id : null;
  }

  get timestamp() {
    return firebase.firestore.FieldValue.serverTimestamp();
  }

  createId(): string {
    return this.afs.createId();
  }

  createProjectIdHash(projectId?: string): string {
    const id = projectId ? projectId.split('_')[0] : this.createId();
    return `${id}_${this.getMyUserId()}`;
  }

  get negativeTimestamp(): number {
    const ts = new Date().getTime();
    return -ts;
  }
}
