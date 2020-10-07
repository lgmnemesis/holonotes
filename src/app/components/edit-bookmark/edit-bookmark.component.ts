import { Component, OnInit, ChangeDetectionStrategy, OnDestroy } from '@angular/core';
import { ModalController, NavParams } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';
import { Timeline } from '../../interfaces/timeline';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-edit-bookmark',
  templateUrl: './edit-bookmark.component.html',
  styleUrls: ['./edit-bookmark.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditBookmarkComponent implements OnInit, OnDestroy {

  overWriteMessageText = 'Will overwrite bookmark\'s settings with current videos settings';

  bookmark: Timeline;
  modalTitle = 'Edit Bookmark';
  name: string;
  description: string;
  tagName: string;
  markerName: string;
  currentName: string;
  currentDescription: string;
  currentTagName: string;
  currentMarkerName: string;
  nameMaxLength: number;
  descMaxLength: number;
  isShowOnTimelineChecked = false;
  initialIsShowOnTimelineChecked = false;
  shouldSetCurrentSettings = false;
  customAlertOptions = {mode: 'ios'};
  canSave = false;
  _router: Subscription;

  constructor(private modalCtrl: ModalController,
    private navParams: NavParams,
    private sharedService: SharedService,
    private router: Router) { }

  ngOnInit() {
    this.bookmark = this.navParams.get('bookmark');
    this.name = this.bookmark.name || '';
    this.description = this.bookmark.description || '';
    this.tagName = this.bookmark.tag_name || '';
    this.markerName = this.bookmark.marker_name || '';
    this.currentName = this.name;
    this.currentDescription = this.description;
    this.currentTagName = this.tagName;
    this.currentMarkerName = this.markerName;
    this.nameMaxLength = this.sharedService.inputNameMaxLength;
    this.descMaxLength = this.sharedService.inputDescriptionMaxLength;
    this.toggleTimelineItem();

    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        const select: HTMLIonAlertElement = document.querySelector('ion-alert');
        if (select) {
          select.dismiss().catch(error => console.error(error));
        }
        this.close();
      }
    });
  }

  inputName(event) {
    this.currentName = event.detail.value;
    this.checkIfCanSave();
  }

  inputDescription(event) {
    this.currentDescription = event.detail.value;
    this.checkIfCanSave();
  }

  inputTagName(event) {
    this.currentTagName = event.detail.value;
    this.checkIfCanSave();
  }

  inputMarkerName(event) {
    this.currentMarkerName = event.detail.value;
    this.checkIfCanSave();
  }

  enableDisableKeyboard(isEnabled) {
    // this.sharedService.enableDisableKeyboard(isEnabled);
  }

  checkIfCanSave() {
    if ((this.name !== this.currentName.trim()) ||
      (this.description !== this.currentDescription.trim()) ||
      (this.tagName !== this.currentTagName.trim()) ||
      (this.markerName !== this.currentMarkerName.trim()) ||
      (this.initialIsShowOnTimelineChecked !== this.isShowOnTimelineChecked)) {
        this.canSave = true;
      } else {
        this.canSave = false;
      }
  }

  close(data?: any) {
    this.modalCtrl.dismiss(data).catch(error => console.error(error));
  }

  save() {
    let data = {};
    if (this.name !== this.currentName ||
      this.description !== this.currentDescription ||
      this.tagName !== this.currentTagName ||
      this.markerName !== this.currentMarkerName ||
      (this.markerName !== '' && !this.isShowOnTimelineChecked) ||
      this.shouldSetCurrentSettings) {
        const mn = !this.isShowOnTimelineChecked ? '' : this.currentMarkerName;
        data = {
          shouldUpdate: true,
          setCurrentSettings: this.shouldSetCurrentSettings,
          name: this.currentName ? this.currentName.trim() : '',
          description: this.currentDescription ? this.currentDescription.trim() : '',
          tag_name: this.currentTagName ? this.currentTagName.trim() : '',
          marker_name: mn ? mn.trim() : ''
        };
    }
    this.close(data);
  }

  setCurrentSettings() {
    this.shouldSetCurrentSettings = true;
    this.save();
  }

  toggleTimelineItem(event?) {
    if (event) {
      this.isShowOnTimelineChecked = event.detail.checked;
    } else if (this.markerName) {
      this.isShowOnTimelineChecked = true;
      this.initialIsShowOnTimelineChecked = this.isShowOnTimelineChecked;
    }
    const item = <HTMLElement>document.getElementById('timeline-item');
    if (this.isShowOnTimelineChecked) {
      item.classList.remove('slideOutDown');
      item.classList.add('slideInUp');
      if (!this.currentMarkerName) {
        this.currentMarkerName = this.currentName;
      }
    } else {
      item.classList.remove('slideInUp');
      item.classList.add('slideOutDown');
    }
    this.checkIfCanSave();
  }

  markerSuggestionDidChange(event) {
    this.currentMarkerName = event.detail.value;
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
