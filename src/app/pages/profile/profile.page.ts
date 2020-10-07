import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { PopoverController, LoadingController, NavController, AlertController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';
import { User } from '../../interfaces/user';
import { Gender } from '../../enums/gender';
import { CanSaveParams } from '../../interfaces/canSaveParams';
import { StorageService } from '../../services/storage.service';
import { NavigationEnd, Router } from '@angular/router';
import { fade, translateYUp } from '../../models/animations';
import { AnalyticsService } from '../../services/analytics.service';
import { TasksSchedulerService } from '../../services/tasks-scheduler.service';

@Component({
  selector: 'app-page-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    fade,
    translateYUp
  ]
})
export class ProfilePage implements OnInit, AfterViewInit, OnDestroy {

  PROFILE_PICTURE_MAX_SIZE = 100000; // in bytes

  userSubsription: Subscription;
  showHomeButton = true;
  canSave = false;
  userProfilePicture = '';
  user: User;
  displayName = '';
  genderType = Gender;
  gender = '';
  about = '';
  nameMaxLength = this.sharedService.inputNameMaxLength;
  aboutMaxLength = this.sharedService.inputDescriptionMaxLength;
  projectId = '';
  _screenRes: Subscription;
  _profilePicture: Subscription;
  _router: Subscription;
  profileErrorMessgae = '';
  isSignInEmailSent = false;
  isDeletedAccount = false;
  canPresent = true;
  _firebaseAuthUser: Subscription;

  canSaveSections = {
    userProfilePicture: <CanSaveParams> {
      value: '',
      canSave: false,
      canBeEmpty: true
    },
    displayName: <CanSaveParams> {
      value: '',
      canSave: false,
      canBeEmpty: false
    },
    gender: <CanSaveParams> {
      value: '',
      canSave: false,
      canBeEmpty: false
    },
    about: <CanSaveParams> {
      value: '',
      canSave: false,
      canBeEmpty: true
    }
  };

  constructor(private navCtrl: NavController,
    public sharedService: SharedService,
    public authService: AuthService,
    private popoverCtrl: PopoverController,
    private cd: ChangeDetectorRef,
    private loadingCtrl: LoadingController,
    private storageService: StorageService,
    private router: Router,
    private alertCtrl: AlertController,
    private analyticsService: AnalyticsService,
    private tasksSchedulerService: TasksSchedulerService) {}

  ngOnInit() {
    this.subscribeToUser();
    this.tasksSchedulerService.start();

    this._screenRes = this.sharedService.screenResUpdated$.subscribe((res) => {
      if (res.widthRangeChanged) {
        this.markForCheck();
      }
    });

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const isProfilePage = e.url.startsWith('/profile');
        if (isProfilePage) {
          this.profileErrorMessgae = '';
          this.markForCheck();
        }
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#profile-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  async signInEmailSent(event) {
    this.unsubscribe();
    const isAnonymousLoggedIn = await this.authService.isAnonymousLoggedIn();
    if (this.authService.isLoggedIn() && !isAnonymousLoggedIn) {
      this.authService.signOut();
    }
    this.isSignInEmailSent = true;
    this.markForCheck();
  }

  subscribeToUser() {
    if (this.userSubsription) {
      this.userSubsription.unsubscribe();
    }
    this.userSubsription = this.authService.user$.subscribe((user) => {
      if (user) {
        this.user = user;
        this.displayName = user.display_name || user.email.split('@')[0];
        this.userProfilePicture = user.profile_photo || this.authService.defaultProfilePhoto;
        this.about = user.about;
        this.setCanSave();
        this.markForCheck();
      }
    });
  }

  async loginAfterProcess() {
    const waiting = await this.presentLoading();
    this.sharedService.loadingSpinnerSubject.next(true);
  }

  async presentLoading(message: string = 'Loading Profile...') {
    this.sharedService.loadingSpinner = await this.loadingCtrl.create({
      spinner: 'bubbles',
      message: message,
      mode: 'ios',
      translucent: true
    });
    return await this.sharedService.loadingSpinner.present();
  }

  async updatePicture(event) {
    if (this._profilePicture) {
      this._profilePicture.unsubscribe();
    }
    this._profilePicture = this.storageService.downloadURL$.subscribe((res) => {
      if (res) {
        if (res.status) {
          const url = res.url;
          this.user.profile_photo = url;
          this.authService.updateUserData(this.user)
          .then(() => {
            this.markForCheck();
            this.sharedService.unloadSpinner();
          })
          .catch((error) => {
            console.error(error);
            this.sharedService.unloadSpinner();
          });
        } else {
          this.sharedService.unloadSpinner();
        }
        this._profilePicture.unsubscribe();
      }
    });
    const files: FileList = event.target.files;
    if (this.user) {
      const file = await this.resizeProfilePicture(files[0]);
      if (!file) {
      } else if (file.type.split('/')[0] !== 'image') {
        this.profileErrorMessgae = 'please choose an image file';
      } else if (file.size >= this.PROFILE_PICTURE_MAX_SIZE) {
        this.profileErrorMessgae =
          'file size is too big. please resize or choose another image';
      } else {
        this.profileErrorMessgae = '';
        const userId = this.user.user_id;
        this.presentLoading('Updating picture...');
        this.storageService.startUpload(file, `profile_pictures/${userId}/profile_picture.jpg`);
      }
    }
  }

  async resizeProfilePicture(file: File): Promise<File> {
    try {
      const width = 60;
      const height = 60;
      const fileName = file.name;
      const readerAsync = new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve(event);
        };
        reader.onerror = reject;

        reader.readAsDataURL(file);
      });
      const readerEvent: any = await readerAsync;

      const img = new Image();
      const imgAsync = new Promise((resolve, reject) => {
        img.src = readerEvent.target.result;
        img.onload = (event) => {
          resolve(event);
        };
        img.onerror = reject;
      });
      const imgEvent: any = await imgAsync;

      const el = document.createElement('canvas');
      el.width = width;
      el.height = height;
      const ctx = el.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const toBlobAsync = new Promise((resolve, reject) => {
        ctx.canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 1);
      });

      return await toBlobAsync.then((blob) => {
        const f = new File([<any>blob], fileName, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        return f;
      });

    } catch (error) {
     console.error(error);
    }
    return await file;
  }

  setCanSave() {
    this.canSaveSections.displayName.value = this.displayName || '';
    this.canSaveSections.userProfilePicture.value = this.userProfilePicture;
    this.canSaveSections.gender.value = this.user.gender || this.genderType.None;
    this.canSaveSections.about.value = this.user.about || '';
    this.setGender(this.user.gender);
  }

  setGender(event) {
    const gender = event && event.detail ? event.detail.value : event;
    this.gender = gender;
    // if (gender === this.genderType.Male) {
    // } else if (gender === this.genderType.Female) {
    // } else {
    //   this.gender = '';
    // }
    console.log('moshe:', this.gender, gender);
    this.checkIfCanSave(this.canSaveSections.gender, gender);
  }

  resetCanSave() {
    for (const key in this.canSaveSections) {
      if (this.canSaveSections.hasOwnProperty(key)) {
        this.canSaveSections[key].canSave = false;
      }
    }
    this.canSave = false;
    this.markForCheck();
  }

  checkIfCanSave(saveSubObject: CanSaveParams, currentValue: string) {
    if (!currentValue || !saveSubObject) {
      return;
    }
    const value = currentValue.trim();
    saveSubObject.canSave = false;
    if (saveSubObject.value.trim() !== value) {
      if (value !== '' || saveSubObject.canBeEmpty) {
        saveSubObject.canSave = true;
      }
    }
    this.canSave = false;
    for (const key in this.canSaveSections) {
      if (this.canSaveSections.hasOwnProperty(key)) {
        if (this.canSaveSections[key].canSave) {
          this.canSave = true;
        }
      }
    }
  }

  displayNameInput(event) {
    this.displayName = event.detail.value;
    this.checkIfCanSave(this.canSaveSections.displayName, this.displayName);
  }

  aboutInput(event) {
    this.about = event.detail.value;
    this.checkIfCanSave(this.canSaveSections.about, this.about);
  }

  notesEventHandler(event) {
    if (event.type === 'profilePage') {
      this.gotoProfile(event.event);
    } else if (event.type === 'moreOptionsPage') {
      this.presentPopover(event.event, UserProfileComponent);
    }
  }

  gotoProfile(event: Event) {
    if (this.authService.isLoggedIn()) {
      this.presentPopover(event, UserProfileComponent);
    } else {
    }
  }

  async presentPopover(ev: Event, component: any) {
    const popover = await this.popoverCtrl.create({
      component: component,
      event: ev,
      translucent: false,
      mode: 'ios',
      cssClass: 'user-profile-popover'
    });

    return await popover.present();
  }

  async presentAlertConfirm() {
    if (!this.canPresent) {
      return;
    }
    this.canPresent = false;

    const alert = await this.alertCtrl.create({
      header: 'Are you sure?',
      message: 'All your Holonotes account data will be deleted.',
      mode: 'ios',
      cssClass: 'collections-delete-projects-css-class',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
          }
        }, {
          text: 'Delete Account',
          cssClass: 'collections-delete-css-class',
          handler: () => {
            this.deleteAccount();
          }
        }
      ]
    });

    alert.onDidDismiss()
    .then((res) => {
      this.canPresent = true;
    })
    .catch((error) => {
      this.canPresent = true;
      console.error(error);
    });

    await alert.present();
  }

  go(url: string) {
    this.navCtrl.navigateRoot(url)
    .catch((error) => {
      console.error(error);
      this.sharedService.unloadSpinner();
    });
  }

  goHome() {
    this.go('/home');
  }

  goProject() {
    this.go('/project/' + this.projectId);
  }

  successSignin(event) {
    if (event && event.user && event.user.isAnonymous) {
      this.sharedService.presentToast('Logged in as Guest', 3000);
      this.goHome();
    } else {
      this.sharedService.presentToast('Logged in as ' + event.email, 3000);

      this._firebaseAuthUser = this.authService.afAuth.authState.subscribe( async (user) => {
        if (user) {
          const data: User = {
            user_id: user.uid,
            email: user.email,
            display_name: user.email.split('@')[0],
            roles: {
              betaTester: false
            }
          };

          try {
            const onlyIfNotExists = true;
            await this.authService.updateUserData(data, onlyIfNotExists);
          } catch (error_1) {
            console.error(error_1);
          }

          this.projectId = event.projectId || '';
          if (this.projectId.length > 0) {
            this.goProject();
          } else {
            this.goHome();
          }
        }
      });
    }
  }

  cancel() {
    this.resetCanSave();
    this.displayName = this.canSaveSections.displayName.value;
    this.userProfilePicture = this.canSaveSections.userProfilePicture.value;
    this.gender = this.canSaveSections.gender.value;
    this.about = this.canSaveSections.about.value;
    this.setGender(this.gender);
  }

  delete() {
    this.presentAlertConfirm();
  }

  deleteAccount() {
    this.presentLoading('Deleting your data...');

    const data: User = {
      user_id: this.user.user_id,
      email: this.user.email,
      profile_photo: this.userProfilePicture,
      display_name: this.displayName,
      gender: this.gender,
      about: this.about || '',
      roles: this.user.roles
    };
    this.authService.deleteCurrentUser(data).then(() => {
      this.unsubscribe();
      setTimeout(() => {
        this.isDeletedAccount = true;
        this.sharedService.unloadSpinner();
        this.markForCheck();
      }, 8000);
    })
    .catch(error => {
      console.error(error);
      this.sharedService.unloadSpinner();
      this.markForCheck();
    });
    this.analyticsService.sendDeleteAcountEvent();
  }

  save() {
    if (!this.canSave) {
      return;
    }
    const data: User = {
      user_id: this.user.user_id,
      email: this.user.email,
      profile_photo: this.userProfilePicture,
      display_name: this.displayName,
      gender: this.gender,
      about: this.about || '',
      roles: this.user.roles
    };
    this.profileErrorMessgae = '';
    this.authService.updateUserData(data)
    .then(() => {
      this.resetCanSave();
    })
    .catch(error => {
      console.error(error);
    });
  }

  unsubscribe() {
    if (this.userSubsription) {
      this.userSubsription.unsubscribe();
    }
    if (this._screenRes) {
      this._screenRes.unsubscribe();
    }
    if (this._profilePicture) {
      this._profilePicture.unsubscribe();
    }
    if (this._router) {
      this._router.unsubscribe();
    }
    if (this._firebaseAuthUser) {
      this._firebaseAuthUser.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.unsubscribe();
    setTimeout(() => {
      this.sharedService.unloadSpinner();
    }, 3000);
  }
}
