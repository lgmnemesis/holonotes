export interface ActiveNotification {
  id: number;
  title: string;
  content: string;
  isPersist: boolean;
  isLoadedFromStore: boolean;
  type: 'generic' | 'new_version' | 'new_song_each_time';
  extra?: {
    taskId: string
  };
}
