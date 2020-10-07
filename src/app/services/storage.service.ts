import { Injectable } from '@angular/core';
import { AngularFireUploadTask, AngularFireStorage } from '@angular/fire/storage';
import { Observable, Subscription, BehaviorSubject } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  task: AngularFireUploadTask;
  snapshot: Observable<any>;
  _snapshot: Subscription;
  onFinishSubject = new BehaviorSubject(null);
  onFinish$ = this.onFinishSubject.asObservable();
  _onFinish: Subscription;
  downLoadURLSubject: BehaviorSubject<{status: boolean, url: string}> =
    new BehaviorSubject(null);
  downloadURL$ = this.downLoadURLSubject.asObservable();
  isUploading = false;

  constructor(private storage: AngularFireStorage) {
    this.subscribeToOnFinish();
  }

  subscribeToOnFinish() {
    if (this._onFinish) {
      return;
    }
    this._onFinish = this.onFinish$.subscribe((path) => {
      if (path) {
        this.onFinishUpload(path);
      }
    });
  }

  startUpload(file: File, preffix: string) {
    if (this.isUploading) {
      return;
    }
    this.isUploading = true;
    const path = `${preffix}`;

    this.task = this.storage.upload(path, file);
    this.snapshot = this.task.snapshotChanges();

    this._snapshot = this.snapshot.pipe(finalize(() => {
      this.onFinishSubject.next(path);
      this.onFinishSubject.next(null);
    })).subscribe();
  }

  onFinishUpload(path: string) {
    this.storage.ref(path).getDownloadURL()
      .pipe(take(1)).toPromise()
      .then((url) => {
        this.downLoadURLSubject.next({status: true, url: url});
        this.downLoadURLSubject.next(null);
      })
      .catch((error) => {
        console.error(error);
        this.downLoadURLSubject.next({status: false, url: ''});
        this.downLoadURLSubject.next(null);
      });

    if (this._snapshot) {
      this._snapshot.unsubscribe();
    }
    this.isUploading = false;
  }
}
