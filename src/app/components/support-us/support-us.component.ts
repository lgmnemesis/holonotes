import { Component, Output, EventEmitter, Input } from '@angular/core';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-support-us',
  templateUrl: './support-us.component.html',
  styleUrls: ['./support-us.component.scss'],
})
export class SupportUsComponent {

  patreonUrl = 'https://www.patreon.com/bePatron?u=26086351';
  paypalUrl = 'https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=CPZ7VEZATV4ZG&source=url';

  @Input() showingComment = false;
  @Output() showCommentBoxEvent = new EventEmitter();

  constructor(private analyticsService: AnalyticsService) { }

  showCommentBox() {
    if (!this.showingComment) {
      this.showCommentBoxEvent.next(true);
      this.showingComment = true;
    }
  }

  openPatreon() {
    this.analyticsService.sendSupportUsEvent('patreon');
    this.openNewTab(this.patreonUrl);
  }

  openPaypal() {
    this.analyticsService.sendSupportUsEvent('paypal');
    this.openNewTab(this.paypalUrl);
  }

  openNewTab(url: string, params = '') {
    try {
      window.open(url, '', params);
    } catch (error) {
      console.error(error);
    }
  }
}
