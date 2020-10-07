import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-feed-slider',
  templateUrl: './feed-slider.component.html',
  styleUrls: ['./feed-slider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeedSliderComponent {

  @Input() feedTitle = '';
  @Input() linkButton = '';
  @Input() containerTop = false;
  @Input() withBoxShadow = false;
  @Output() linkEvent = new EventEmitter();

  slideOpts = {
    effect: 'slide',
    slidesPerView: 'auto',
    spaceBetween: 5,
    breakpointsInverse: true,
    freeMode: true,
    grabCursor: false
  };

  constructor(private cd: ChangeDetectorRef) {}

  loaded() {
    this.cd.markForCheck();
  }

}
