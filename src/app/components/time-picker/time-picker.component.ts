import { Component, OnInit, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { DateTimeService } from '../../date-time.service';
import { ReportTimePicker } from '../../interfaces/journy-history';

@Component({
  selector: 'app-time-picker',
  templateUrl: './time-picker.component.html',
  styleUrls: ['./time-picker.component.scss'],
})
export class TimePickerComponent implements OnInit {

  @Input() activeButton: ReportTimePicker = { picker: 'this week' };

  constructor(private popoverCtrl: PopoverController,
    private dateTimeService: DateTimeService) { }

  ngOnInit() {}

  selected(select: any) {
    const data: ReportTimePicker = {picker: select};
    this.dateTimeService.timePickerEvents.next(data);
    this.close(data);
  }

  close(data?: any) {
    this.popoverCtrl.dismiss(data);
  }
}
