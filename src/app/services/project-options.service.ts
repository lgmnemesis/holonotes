import { Injectable } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { Project } from '../interfaces/project';
import { DatabaseService } from './database.service';
import { SharedService } from './shared.service';
import { BehaviorSubject } from 'rxjs';
import { SocialSharingService } from './social-sharing.service';

@Injectable({
  providedIn: 'root'
})
export class ProjectOptionsService {

  project: Project;
  onHandlerSubject = new BehaviorSubject(this.handlerObj());
  onHandler$ = this.onHandlerSubject.asObservable();
  backupCurrentProject: Project;
  actionSheet: HTMLIonActionSheetElement = null;
  socialSharingParams = null;

  addToLibrary = {
    text: 'Add to Library',
    handler: () => {
      this.databaseService.copyProject(this.project).catch((error) => {
        console.error(error);
      });

      const name = this.sharedService.capitalize(this.project.name);
      const message = '\'' + name + '\'' + ' added to your library';
      this.sharedService.presentToast(message, 3000);
    }
  };

  share = {
    text: 'Share',
    handler: () => {
      this.shareMenu();
    }
  };

  shareToTwitter = {
    text: 'Share to Twitter',
    icon: 'logo-twitter',
    handler: () => {
      this.socialSharingService.shareOnTwitter(this.socialSharingParams);
    }
  };

  shareToFacebook  = {
    text: 'Share to Facebook',
    icon: 'logo-facebook',
    handler: () => {
      this.socialSharingService.shareOnFacebook(this.socialSharingParams);
    }
  };

  shareToPinterest = {
    text: 'Share to Pinterest',
    icon: 'logo-pinterest',
    handler: () => {
      this.socialSharingService.shareOnPinterest(this.socialSharingParams);
    }
  };

  shareToWhatsapp = {
    text: 'Share to Whatsapp',
    icon: 'logo-whatsapp',
    handler: () => {
      this.socialSharingService.shareOnWhatsapp(this.socialSharingParams);
    }
  };

  copyLink = {
    text: 'Copy Link',
    cssClass: 'copy-link-url',
    handler: () => {
      // handled by running copyLinkUrl() inside a click listener
      const el = <HTMLInputElement>document.querySelector
      ('.project-options-action-sheet .copy-link-url');
      this.copyLinkUrl(el);
    }
  };

  edit = {
    text: 'Edit',
    handler: () => {
      const obj = this.handlerObj();
      obj.project = this.project;
      obj.editProject = true;
      this.onHandlerSubject.next(obj);
      // reseting last value
      this.onHandlerSubject.next(this.handlerObj());
    }
  };

  removeFromCollection = {
    text: '',
    handler: () => {
      const obj = this.handlerObj();
      obj.project = this.project;
      obj.deleteSelected = true;
      this.onHandlerSubject.next(obj);
      // reseting last value
      this.onHandlerSubject.next(this.handlerObj());
    }
  };

  cancel = {
    text: 'Cancel',
    handler: () => {
    }
  };

  constructor(private actionSheetCtrl: ActionSheetController,
    private databaseService: DatabaseService,
    private sharedService: SharedService,
    private socialSharingService: SocialSharingService) {
      this.backupCurrentProject = this.sharedService.currentProject;
    }

  moreOptionsForHomePage(project: Project) {
    this.socialSharingParams = this.socialSharingService.buildLinkForPreview(project);
    this.project = project;
    const buttons = [
      this.addToLibrary,
      this.share,
      this.copyLink,
      this.cancel
    ];
    this.presentActionSheet(buttons);
  }

  moreOptionsForCollectionsPage(project: Project, isDelete: boolean) {
    this.project = project;
    this.socialSharingParams = this.socialSharingService.buildLinkForPreview(project);
    if (isDelete) {
      this.removeFromCollection.text = 'Delete';
    } else {
      this.removeFromCollection.text = 'Remove';
    }
    const buttons = [
      this.edit,
      this.removeFromCollection,
      this.share,
      this.copyLink,
      this.cancel
    ];
    this.presentActionSheet(buttons);
  }

  shareMenu() {
    this.sharedService.currentProject = this.project;
    this.socialSharingParams = this.socialSharingService.buildLinkForPreview(this.project);
    const buttons = [
      this.shareToTwitter,
      this.shareToFacebook,
      this.shareToPinterest,
      this.shareToWhatsapp,
      this.cancel
    ];
    this.presentActionSheet(buttons, 'share');
  }

  async presentActionSheet(buttons, id = '') {
    this.actionSheet = await this.actionSheetCtrl.create({
      buttons: buttons,
      mode: 'ios',
      cssClass: 'project-options-action-sheet'
    });
    this.actionSheet.onDidDismiss()
    .then((res) => {
      if (id === 'share') {
        this.sharedService.currentProject = this.backupCurrentProject;
      }
    })
    .catch((error) => {
      if (id === 'share') {
        this.sharedService.currentProject = this.backupCurrentProject;
      }
      console.error(error);
    });

    await this.actionSheet.present();
  }

  handlerObj() {
    return {
      project: null,
      editProject: false,
      deleteSelected: false,
      sharePreview: false
    };
  }

  copyLinkUrl(parentElement: HTMLElement, link?: string) {
    const url = link || 'https://holonotes.io/project/' + this.project.id + '/preview';
    this.sharedService.copyLinkUrl(parentElement, url);
  }
}
