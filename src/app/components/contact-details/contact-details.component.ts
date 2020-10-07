import { Component, OnInit, Input,
  ChangeDetectionStrategy, ChangeDetectorRef, AfterViewInit,
  ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { SocialSharingService } from '../../services/social-sharing.service';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatabaseService } from '../../services/database.service';
import { translateYDownLong } from '../../models/animations';

@Component({
  selector: 'app-contact-details',
  templateUrl: './contact-details.component.html',
  styleUrls: ['./contact-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    translateYDownLong
  ]
})
export class ContactDetailsComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input() showFollowUsOn = false;
  @ViewChild('textarea', { static: true }) textArea: ElementRef;

  textMaxLengh = 1000;
  isTextAreaFocused = false;
  commentInput = '';
  isTextMessageSent = false;
  _router: Subscription;

  constructor(private socialSharingService: SocialSharingService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private databaseService: DatabaseService) { }

  ngOnInit() {
    this._router = this.router.events.subscribe(e => {
      if (e instanceof NavigationEnd) {
        this.resetTextMessage();
      }
    });
  }

  ngAfterViewInit() {
    this.textArea.nativeElement.maxLength = this.textMaxLengh;
    this.textArea.nativeElement.value = '';
    this.cd.markForCheck();
  }

  setTextAreaFocus(isFocus: boolean) {
    this.isTextAreaFocused = isFocus;
  }

  inputComment(event) {
    this.commentInput = event.value;
  }

  followOnFacebook() {
    this.socialSharingService.followOnFacebook();
  }

  followOnTwitter() {
    this.socialSharingService.followOnTwitter();
  }

  mailto() {
    this.socialSharingService.mailto();
  }

  sendTextMessage() {
    this.isTextMessageSent = true;
    this.databaseService.addFeedback(this.commentInput);
    this.cd.markForCheck();
  }

  resetTextMessage() {
    if (this.isTextMessageSent) {
      this.commentInput = '';
      this.textArea.nativeElement.value = this.commentInput;
      this.isTextAreaFocused = false;
      this.isTextMessageSent = false;
      this.cd.markForCheck();
    }
  }

  ngOnDestroy() {
    if (this._router) {
      this._router.unsubscribe();
    }
  }
}
