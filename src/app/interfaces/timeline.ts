export interface Timeline {
  id: number;
  name: string;
  description?: string;
  lesson_id: string;
  lesson_currentTime: number;
  lesson_start_at: number;
  lesson_end_at: number;
  lesson_isLoopEnabled?: boolean;
  lesson_isActivePlayer?: boolean;
  source_id: string;
  source_currentTime: number;
  source_start_at: number;
  source_end_at: number;
  source_isLoopEnabled?: boolean;
  source_isActivePlayer?: boolean;
  tag_name?: string; // label
  marker_name?: string;
  preview_tag?: string; // on|off
}

