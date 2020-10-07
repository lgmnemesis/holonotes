import { Timeline } from './timeline';
import { Video } from './video';

export interface Project {
  user_id: string;
  id: string;
  name: string;
  timestamp?: number;
  artist?: string;
  search_tags?: string[];
  author_name: string;
  source_player: {
    video_url: string,
    video_type: string
  };
  lesson_player: {
    video_url: string,
    video_type: string
  };
  bookmarks: Timeline[];
  videos: Video[];
  collections: string[];
  showInstructions?: boolean;
  is_public: boolean;
  cover_img: string;
  preview_description: string;
  dontShow?: boolean;
}
