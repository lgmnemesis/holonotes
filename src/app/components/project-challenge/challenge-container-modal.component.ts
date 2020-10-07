import { Component, Input, AfterViewInit } from '@angular/core';
import { Challenge } from '../../interfaces/task';
import { ModalController } from '@ionic/angular';
import { SharedService } from '../../services/shared.service';

@Component({
  selector: 'app-challenge-container-modal',
  templateUrl: './challenge-container-modal.component.html',
  styleUrls: ['./challenge-container-modal.component.scss'],
})
export class ChallengeContainerModalComponent implements AfterViewInit {

  @Input() challenge: Challenge;
  @Input() animate = true;
  @Input() canSetPublic = true;

  title = 'Challenge';

  constructor(private modalCtrl: ModalController,
    private sharedService: SharedService) { }

  ngAfterViewInit() {
    try {
      const content = document.querySelector('#challenge-c-m-content-scrollbar');
      this.sharedService.styleIonScrollbars(content);
    } catch (error) {
      console.error(error);
    }
  }

  addChallenge(challenge: Challenge) {
    this.close({challenge: challenge, isAdded: true});
  }

  close(data: any) {
    this.modalCtrl.dismiss(data);
  }

}
