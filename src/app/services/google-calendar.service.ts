import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { GoogleCalendarEvent, GoogleCalendarSignIn } from '../interfaces/task';

declare var gapi: any;

@Injectable({
  providedIn: 'root'
})
export class GoogleCalendarService {

  initClientExecuted = false;
  timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  signInErrorCounter = 0;

  constructor(private authService: AuthService) {
   }

  // Initialize the Google API client with desired scopes
  initClient() {
    if (this.initClientExecuted) {
      return;
    }
    this.initClientExecuted = true;
    gapi.load('client', () => {
      // It's OK to expose these credentials, they are client safe.
      gapi.client.init({
        apiKey: 'AIzaSyC-TQ6ZQMcYeWwHnjD7-BOXtf_XpR6lYDY',
        clientId: '768983578966-6dbj22tirg6a6ej4elo77ce9eg60n8b6.apps.googleusercontent.com',
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: 'https://www.googleapis.com/auth/calendar.events'
      }).then(() => {
        gapi.client.load('calendar', 'v3', () => {
        });
      }).catch((error) => console.error(error));
    });
  }

  async signIn(): Promise<GoogleCalendarSignIn> {
    if (!gapi || !gapi.auth2) {
      return null;
    }
    const result: GoogleCalendarSignIn = await gapi.auth2.getAuthInstance().signIn({
        prompt: 'consent'
      })
      .then((res) => {
        this.signInErrorCounter = 0;
        return {isSignedIn: true, isCanceledByUser: false, result: res};
      })
      .catch((error) => {
        console.error(error);
        this.signInErrorCounter++;
        if (error && error.error &&
          (error.error.match(/closed.+by.+user/) || error.error.match(/access_denied/))) {
          this.signOut();
          return {isSignedIn: false, isCanceledByUser: true, result: null};
        }
        // if more then 2 failures, mark it as canceled by user.
        const isCancel = this.signInErrorCounter > 1;
        return {isSignedIn: false, isCanceledByUser: isCancel, result: null};
      });
    return result;
  }

  async signOut() {
    if (!gapi || !gapi.auth2) {
      return null;
    }
    return await gapi.auth2.getAuthInstance().signOut().catch(error => console.error(error));
  }

  isConnected() {
    this.initClient();
    const googleAuth = gapi.auth2.getAuthInstance();
    return googleAuth && googleAuth.isSignedIn.get();
  }

  async updateEvent(event: GoogleCalendarEvent):
  Promise<{ isInitial: boolean, isSuccess: boolean, isLoggedIn: boolean }> {
    if (!gapi.client || !gapi.client.calendar) {
      return { isInitial: false, isSuccess: false, isLoggedIn: false };
    }
    const startTimeIso = new Date(event.startTime).toISOString();
    const endTimeIso = new Date(event.endTime).toISOString();
    let update = null;
    try {
      update = await gapi.client.calendar.events.update({
        calendarId: 'primary',
        eventId: event.eventId,
        start: {
          dateTime: startTimeIso,
          timeZone: this.timezone
        },
        end: {
          dateTime: endTimeIso,
          timeZone: this.timezone
        },
        recurrence: [
          event.recurrence
        ],
        summary: event.summary,
        description: event.description
      })
      .then((msg) => {
        return { isInitial: true, isSuccess: true, isLoggedIn: true };
      })
      .catch(error => {
        console.error(error);
        const code = error.result && error.result.error ? error.result.error.code : null;
        if (code === 401) {
          return { isInitial: true, isSuccess: false, isLoggedIn: false };
        }
      });
    } catch (error) {
      console.error(error);
    }
    return update;
  }

  async deleteEvent(event: GoogleCalendarEvent):
  Promise<{ isInitial: boolean, isSuccess: boolean, isLoggedIn: boolean }> {
    if (!gapi.client || !gapi.client.calendar) {
      return { isInitial: false, isSuccess: false, isLoggedIn: false };
    }
    let deleteE = null;
    try {
      deleteE = await gapi.client.calendar.events.delete({
         calendarId: 'primary',
         eventId: event.eventId,
       })
       .then(() => {
         return { isInitial: true, isSuccess: true, isLoggedIn: true };
       })
       .catch(error => {
         console.error(error);
         const code = error.result && error.result.error ? error.result.error.code : null;
         if (code === 401) {
           return { isInitial: true, isSuccess: false, isLoggedIn: false };
         }
       });
     } catch (error) {
       console.error(error);
     }
     return deleteE;
  }

  async insertEvent(event: GoogleCalendarEvent):
  Promise<{ isInitial: boolean, isSuccess: boolean, isLoggedIn: boolean }> {
    if (!gapi.client || !gapi.client.calendar) {
      return { isInitial: false, isSuccess: false, isLoggedIn: false };
    }
    const startTimeIso = new Date(event.startTime).toISOString();
    const endTimeIso = new Date(event.endTime).toISOString();
    let insert = null;
    try {
     insert = await gapi.client.calendar.events.insert({
        calendarId: 'primary',
        id: event.eventId,
        start: {
          dateTime: startTimeIso,
          timeZone: this.timezone
        },
        end: {
          dateTime: endTimeIso,
          timeZone: this.timezone
        },
        // recurrence ref: https://tools.ietf.org/html/rfc5545#section-3.8.5
        // example: 'RRULE:FREQ=YEARLY;BYDAY=SU,MO,TU,WE,TH;UNTIL=20191028T170000Z'
        recurrence: [
          event.recurrence
        ],
        summary: event.summary,
        description: event.description
      })
      .then((msg) => {
        return { isInitial: true, isSuccess: true, isLoggedIn: true };
      })
      .catch(error => {
        console.error(error);
        const code = error.result && error.result.error ? error.result.error.code : null;
        if (code === 401) {
          return { isInitial: true, isSuccess: false, isLoggedIn: false };
        }
      });
    } catch (error) {
      console.error(error);
    }
    return insert;
  }

}
