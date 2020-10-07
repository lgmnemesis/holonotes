import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Thumbnail } from '../interfaces/thumbnail';

@Injectable({
  providedIn: 'root'
})
export class SearchVideosService {

  URL = environment.FUNCTIONS_APP_URL;
  private isSearchingIndicator = false;

  constructor(private httpClient: HttpClient) { }

  private isSearching() {
    return this.isSearchingIndicator;
  }

  isVideoUrl(url: string): boolean {
    return url && url.match(/^https:.*youtube.*v=[0-9a-zA-Z_-]+/) !== null;
  }

  async getThumbnail(url: string) {
    if (this.isSearching() || !this.isVideoUrl(url)) {
      return null;
    }
    this.isSearchingIndicator = true;

    const thumbnail: Thumbnail = {};
    let vid = url.split('v=')[1];
    vid = vid.split('&')[0];

    const fullUrl = `${this.URL}/ut-thumbnail?id=${vid}`;
    const result = await this.httpGet(fullUrl);
    if (result) {
      thumbnail.title = (<Thumbnail>result).title;
      thumbnail.thumbnail_url = (<Thumbnail>result).thumbnail_url;
      thumbnail.video_id = vid;
    }
    this.isSearchingIndicator = false;
    return thumbnail;
  }

  async searchVideos(name: string) {
    if (this.isSearching()) {
      return null;
    }
    this.isSearchingIndicator = true;

    const fullUrl = `${this.URL}/ut-search?q=${name}'`;
    const result = await this.httpGet(fullUrl);

    this.isSearchingIndicator = false;
    return result ? (<any>result).items : null;
  }

  private async httpGet(url: string) {
    try {
      return this.httpClient.get(url).toPromise().catch((error) => {
        console.error(error);
      });
    } catch (error) {
      console.error(error);
    }
  }

  getFromTitle(title: string) {
    if (!title) {
      return null;
    }
    const split = title.split(/[,|-]/);
    let [artist, name] = split;
    if (split && split.length === 1) {
      name = artist;
      artist = '';
    }
    return {name: name, artist: artist};
  }
}
