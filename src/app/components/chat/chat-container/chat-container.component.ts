import { Component, OnInit, Input, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef, Output, EventEmitter } from '@angular/core';
import { Chat, ChatAction, Message } from '../../../interfaces/message';
import { ChatService } from '../../../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-container',
  templateUrl: './chat-container.component.html',
  styleUrls: ['./chat-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChatContainerComponent implements OnInit, OnDestroy {

  @Input() myUserId = null;
  @Input()
  set chatId(id: string) {
    if (id) {
      this.loadChat(id);
    }
  }
  @Input()
  set action(chatAction: ChatAction) {
    if (chatAction && chatAction.action === 'add' &&
      chatAction.message && chatAction.message.length > 0) {
      this.addMessage(chatAction.message);
    }
  }
  @Output() chatUpdateEvent: EventEmitter<{chat: Chat, isOnLoad: boolean}> = new EventEmitter();

  chat: Chat = null;
  _chat: Subscription;
  timeInABottle = {};

  constructor(private chatService: ChatService,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
  }

  markForCheck() {
    this.cd.markForCheck();
  }

  async loadChat(chatId: string) {
    if (this._chat) {
      this._chat.unsubscribe();
    }
    this.chat = null;
    let isLoadChat = true;
    this.timeInABottle = {};
    this._chat = this.chatService.getChatById(chatId).subscribe((chat: Chat) => {
      if (chat && chat.messages) {
        this.chat = chat;
        this.chat.messages.sort((a, b) => (a.createdAt > b.createdAt) ? 1 : -1);
        this.chatUpdateEvent.next({chat: this.chat, isOnLoad: isLoadChat});
        isLoadChat = false;
      }
      this.markForCheck();
    });
  }

  addMessage(messageContent: string) {
    const message = this.chatService.formatMessage(messageContent);
    this.chatService.addMessage(this.chat, message);
  }

  showUserInfo(message: Message) {
  }

  trackById(i, message) {
    return message.id;
  }

  ngOnDestroy() {
    if (this._chat) {
      this._chat.unsubscribe();
    }
  }
}
