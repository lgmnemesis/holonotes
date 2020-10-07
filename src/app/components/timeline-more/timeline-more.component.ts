import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-timeline-more',
  templateUrl: './timeline-more.component.html',
  styleUrls: ['./timeline-more.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimelineMoreComponent implements OnInit {

  constructor(private popoverCtrl: PopoverController) {}

  ngOnInit() {
  }

  overwrite() {
    this.close({action: 'overwrite'});
  }

  edit() {
    this.close({action: 'edit'});
  }

  delete() {
    this.close({action: 'delete'});
  }

  close(data?: any) {
    this.popoverCtrl.dismiss(data);
  }
}
