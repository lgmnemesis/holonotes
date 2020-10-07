import { NgModule } from '@angular/core';
import { GetTimePipe } from './get-time.pipe';
import { ToolbarTabColorPipe } from './toolbar-tab-color.pipe';
import { LoopColorPipe } from './loop-color.pipe';
import { MarkerPositionPipe } from './marker-position.pipe';
import { IsEqualPipe } from './is-equal.pipe';
import { SearchFilterPipe } from './search-filter.pipe';
import { TagLabelDisplayPipe } from './tag-label-display.pipe';
import { FilterTasksPipe } from './filter-tasks.pipe';
import { MinHoursPipe } from './min-hours.pipe';
import { TaskDisplayTimePipe } from './task-display-time.pipe';
import { FilterInArrayPipe } from './filter-in-array.pipe';
import { TaskDurationPipe } from './task-duration.pipe';
import { HistorySortPipe } from './history-sort.pipe';
import { EtimeStimePipe } from './etime-stime.pipe';
import { ChatTimeUnique } from './chat-time-unique.pipe';
import { ChallengeTimeLeftPipe } from './challenge-time-left.pipe';
import { TimeAgoPipe } from './time-ago.pipe';
import { NewsFeedPaginationPipe } from './news-feed-pagination.pipe';

@NgModule({
  declarations: [
    GetTimePipe,
    ToolbarTabColorPipe,
    LoopColorPipe,
    MarkerPositionPipe,
    IsEqualPipe,
    SearchFilterPipe,
    TagLabelDisplayPipe,
    FilterTasksPipe,
    MinHoursPipe,
    TaskDisplayTimePipe,
    FilterInArrayPipe,
    TaskDurationPipe,
    HistorySortPipe,
    EtimeStimePipe,
    ChatTimeUnique,
    ChallengeTimeLeftPipe,
    TimeAgoPipe,
    NewsFeedPaginationPipe
  ],
  imports: [

  ],
  exports: [
    GetTimePipe,
    ToolbarTabColorPipe,
    LoopColorPipe,
    MarkerPositionPipe,
    IsEqualPipe,
    SearchFilterPipe,
    TagLabelDisplayPipe,
    FilterTasksPipe,
    MinHoursPipe,
    TaskDisplayTimePipe,
    FilterInArrayPipe,
    TaskDurationPipe,
    HistorySortPipe,
    EtimeStimePipe,
    ChatTimeUnique,
    ChallengeTimeLeftPipe,
    TimeAgoPipe,
    NewsFeedPaginationPipe
  ]
})

export class Pipes {}
