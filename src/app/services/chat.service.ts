import { Injectable } from '@angular/core';
import { DatabaseService } from './database.service';
import { Observable } from 'rxjs';
import { Message, Chat } from '../interfaces/message';
import { AuthService } from './auth.service';
import { SharedService } from './shared.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  MAX_ALLOWED_CHAT_LENGTH = 998000; // In Bytes

  constructor(private databaseService: DatabaseService,
    public authService: AuthService,
    private sharedService: SharedService) { }

  getChatById(id: string): Observable<{}> {
    return this.databaseService.getChatById(id);
  }

  addMessage(chat: Chat, messageContent: string) {
    if (chat && chat.id && messageContent && this.authService.user) {
      let userName = this.authService.user.display_name;
      if (this.authService.user.isAnonymous) {
        const strHash = this.sharedService.createStrHash(this.databaseService.getMyUserId());
        userName = `${this.authService.user.display_name}${strHash}`;
      }
      const message: Message = {
        id: this.databaseService.createId(),
        content: messageContent,
        createdAt: new Date().getTime(),
        user_id: this.databaseService.getMyUserId(),
        user_name: userName
      };
      this.checkChatSize(chat, message);
      this.databaseService.addMessage(chat.id, message)
      .catch(error => console.error(error));
    }
  }

  checkChatSize(data: Chat, newMessage: Message) {
    const charLen = JSON.stringify(data).length + JSON.stringify(newMessage).length;
    if (charLen > this.MAX_ALLOWED_CHAT_LENGTH) {
      // TODO: firebase function to add a new chat related document so any new message will be writen to the new chat doc
    }
  }

  formatMessage(message: string): string {
    return message.replace(/(http[s]:\/\/[^ ]+)\s*?/g, '<a href="$1" ref="noopener noreferrer" target="_blank">$1</a>');
  }
}
