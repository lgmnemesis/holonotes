import {Injectable} from '@angular/core';
import { AngularFireAuth } from '@angular/fire/auth';
import { AngularFirestore } from '@angular/fire/firestore';
import * as firebase from 'firebase/app';
import { Observable, of, timer, BehaviorSubject, Subscription } from 'rxjs';
import { first, catchError, retryWhen, delayWhen, take, switchMap } from 'rxjs/operators';
import { User } from '../interfaces/user';
import { AnalyticsService } from './analytics.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  defaultProfilePhoto = '/assets/imgs/profile-picture-placeholder.png';

  user: User = null;
  userSubject: BehaviorSubject<User> = new BehaviorSubject(undefined);
  user$ = this.userSubject.asObservable();
  private userInternal$: Observable<User>;
  private _userInternal: Subscription;
  profile_photo: string = null;
  signingOutSubject: BehaviorSubject<boolean> = new BehaviorSubject(false);
  signingOut$ = this.signingOutSubject.asObservable();

  isSubscribe = false;

  constructor(public afAuth: AngularFireAuth,
    private afs: AngularFirestore,
    private analyticsService: AnalyticsService) {
      this.subscribeUser();
      this.signingOut$.subscribe((isSiningOut) => {
        if (isSiningOut) {
          this.signOut();
        }
      });
  }

  subscribeUser() {
    this.unsubscribeUser();
    this.userInternal$ = this.afAuth.authState.pipe(switchMap(user => {
      this.isSubscribe = true;
      if (!environment.production && user) {
        console.log('[DEBUG] Auth user:', user);
      }
      if (user && user.isAnonymous) {
        const guest: User = {
          user_id: user.uid,
          email: '',
          display_name: 'Guest',
          roles: {
            betaTester: false
          },
          isAnonymous: user.isAnonymous
        };
        return of(guest);
      } else if (user) {
        return this.afs.doc<User>(`users/${user.uid}`).valueChanges()
        .pipe(
          retryWhen(errors => {
            return errors.pipe(
              take(5),
              delayWhen(() => timer(5000))
            );
          })
        );
      } else {
        return of(null);
      }
    }));

    this._userInternal = this.userInternal$.subscribe((user: User) => {
      this.user = user;
      this.userSubject.next(user);
    });
  }

  unsubscribeUser() {
    if (this._userInternal) {
      this._userInternal.unsubscribe();
    }
  }

  async updateUserData(data: User, onlyIfNotExists = false): Promise<void> {
    const userDoc = `users/${data.user_id}`;
    const batch = firebase.firestore().batch();
    const usersDoc = firebase.firestore().doc(`${userDoc}`);
    const profilesDoc = firebase.firestore().doc(`public_profiles/${data.user_id}`);
    let userDocExists = false;

    if (onlyIfNotExists) {
      const doc = await this.afs.doc(userDoc).valueChanges().pipe(first())
      .toPromise().catch((error) => {});
      if (doc) {
        userDocExists = true;
      }
    }

    const publicData: User = {
      user_id: data.user_id,
      display_name: data.display_name || '',
      profile_photo: data.profile_photo || ''
    };

    if (userDocExists) {
      return Promise.resolve();
    } else {
      batch.set(usersDoc, data, { merge: true });
      batch.set(profilesDoc, publicData, { merge: true });
      return batch.commit();
    }
  }

  deleteUserData(data: User): Promise<void> {
    const batch = firebase.firestore().batch();
    const usersDoc = firebase.firestore().doc(`users/${data.user_id}`);
    const profilesDoc = firebase.firestore().doc(`public_profiles/${data.user_id}`);

    batch.delete(usersDoc);
    batch.delete(profilesDoc);
    return batch.commit();
  }

  async deleteCurrentUser(data: User) {
    if (this.isLoggedIn()) {
      await this.deleteUserData(data)
      .catch((error) => console.error(error));
      (await this.afAuth.currentUser).delete()
      .catch((error) => console.error(error));
      await this.signOut()
      .catch((error) => console.error(error));
    }
  }

  getUser() {
    return this.afAuth.currentUser
  }

  async isNewUser(): Promise<boolean> {
    const user = await this.getUser();
    return user && user.metadata.creationTime === user.metadata.lastSignInTime;
  }

  async isAnonymousLoggedIn(): Promise<boolean> {
    const user = await this.getUser();
    return user && user.isAnonymous;
  }

  getPublicProfileById(id: string): Observable<User> {
    return this.afs.doc<User>(`public_profiles/${id}`).valueChanges()
    .pipe(catchError((error) => {
      console.error(error);
      return of(null);
    }));
  }

  async signOut() {
    if (await this.isAnonymousLoggedIn()) {
      (await this.afAuth.currentUser).delete()
      .catch((error) => console.error(error));
      this.analyticsService.sendDeleteAnonymousAcountEvent();
    }
    await this.afAuth.signOut();
    this.analyticsService.sendSignOutEvent();
  }

  async isLoggedIn(): Promise<boolean> {
    return !!await this.getUser();
  }
}
