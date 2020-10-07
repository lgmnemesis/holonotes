import { Component, OnInit, ChangeDetectionStrategy, OnDestroy, AfterViewInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-keyboard-shortcuts',
  templateUrl: './keyboard-shortcuts.component.html',
  styleUrls: ['./keyboard-shortcuts.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KeyboardShortcutsComponent implements OnInit, AfterViewInit, OnDestroy {

  modalTitle = 'Keyboard Shortcuts';
  _router: Subscription;

  constructor(private modalCtrl: ModalController,
    private router: Router,
    private sharedService: SharedService) { }

  ngOnInit() {
    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.close();
      }
    });
  }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#keyboard-s-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  close() {
    this.modalCtrl.dismiss().catch(error => console.error(error));
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
