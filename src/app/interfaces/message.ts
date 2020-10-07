import { User } from './user';

export interface Message {
  user_id: string;
  id: string;
  content: string;
  createdAt: Date | number;
  user_name: string;
  profile?: User;
}

export interface Chat {
  id: string;
  user_id: string;
  is_public: boolean;
  admins: string[];
  participates: string[];
  messages: Message[];
}

export interface ChatAction {
  action: 'add';
  message: string;
}
