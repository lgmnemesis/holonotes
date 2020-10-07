export interface Journey {
  id: string;
  name: string;
  start_time: number;
  end_time: number;
  is_selected?: boolean;
}

export interface JourneyInputEvent {
  name: string;
  isStarted?: boolean;
  isAddMode?: boolean;
  isDelete?: boolean;
  start_time?: number;
  end_time?: number;
  gotoJourney?: boolean;
}

export interface History {
  user_id: string;
  journey_list: Journey[];
}

export interface Report {
  list: Journey[];
  data: number[];
  labels: string[];
  totalInSec: number;
  total: string;
}

export interface ReportTimePicker {
  picker: 'today' | 'yesterday' | 'this week' | 'last week' | 'this month' | 'last month' | 'this year' | 'last year';
}

export interface BarChartType {
  type: 'bar' | 'horizontalBar';
  width: string;
  height: string;
}
