import { Project } from './project';
import { Subscription } from 'rxjs';

export interface Task {
  id: string;
  name: string;
  categories_ids: string[];
  custom_categories?: Category[];
  alarms: Alarm[];
  timeInMinutes?: number;
  is_active: boolean;
  challenge: Challenge;
  is_completed: boolean;
  user_id: string;
  google_calender: boolean;
}

export interface Challenge {
  is_challenge: boolean;
  id: string;
  shared_id?: string;
  joined?: boolean; // joined public challenge
  name: string;
  description: string[];
  journey_desc: string;
  goal: string;
  duration: string;
  start_day: number;
  days: number;
  actual_days: number[];
  days_to_finish: number;
  all_week: boolean;
  is_in_weeks: boolean;
  time: string;
  completed_message: string;
  is_user_made: boolean;
  is_public: boolean;
  shared_with: string[];
  project?: {
    id: string;
    name: string;
    artist: string;
    imgUrl: string;
  };
  dev_mode?: boolean;
  week_goal?: {
    text: string;
    sub_text: string;
    project_id?: string;
    image: string
  }[];
  img_url?: string;
  updatedFields?: {
    isUpdated: boolean;
    project: Project;
    data: any;
  };
  stats?: {
    participants: number;
    average_per_day: number;
  };
}

export interface JoinedChallenges {
  [key: string]: {
    myTask: Task,
    sharedTask: Task,
    subscription: Subscription
  };
}

export interface Category {
  id: string;
  name: string;
  description: string;
  type: 'generic' | 'song' | 'custom_song' | '';
  duration: string;
  is_global: boolean;
  project_id?: string;
}

export interface Alarm {
  id: string;
  date: string;
  time: string;
  days: boolean[];
}

export interface TaskStarted {
  task: Task;
  categoryId: string;
  state: number; // 0: stop, 1: start, 2: skip, 3: pause, 4: resume
  duration: number;
  categoryDuration: number;
  timePassed: number;
  categoryTimePassed: number;
  categoryIndex: number;
  startedTime: number;
}

export interface SelectingSongCategory {
  isSelecting: boolean;
  project: Project;
  task: Task;
  category: Category;
}

export interface GoogleCalendarEvent {
  eventId: string;
  startTime: number;
  endTime: number;
  summary: string;
  description: string;
  recurrence: string;
}

export interface GoogleCalendarSignIn {
  isSignedIn: boolean;
  isCanceledByUser: boolean;
  result: any;
}

