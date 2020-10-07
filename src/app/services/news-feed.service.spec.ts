import { TestBed } from '@angular/core/testing';

import { NewsFeedService } from './news-feed.service';

describe('NewsFeedService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NewsFeedService = TestBed.get(NewsFeedService);
    expect(service).toBeTruthy();
  });
});
