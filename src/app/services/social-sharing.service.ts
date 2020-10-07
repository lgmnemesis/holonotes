import { Injectable } from '@angular/core';
import { SharedService } from './shared.service';
import { DatabaseService } from './database.service';
import { AnalyticsService } from './analytics.service';
import { SocialShareParams } from '../interfaces/social-share-params';
import { Project } from '../interfaces/project';
import { Task } from '../interfaces/task';

@Injectable({
  providedIn: 'root'
})
export class SocialSharingService {

  constructor(private sharedService: SharedService,
    private databaseService: DatabaseService,
    private analyticsService: AnalyticsService) { }

  shareOnTwitter(params: SocialShareParams): Window {
    if (!params) {
      return null;
    }
    if (params.pageName === 'preview') {
      this.setProjectAsPublic();
    }

    const base_url = 'https://twitter.com/intent/tweet?';
    const underText = params.text.replace(/\s+/g, '_').replace('&', 'and');
    const description = params.description.replace(/\s+/g, '_').replace('&', 'and');
    const holonotes_link_url = `${params.linkUrl}?t=${underText}&d=${description}&v=${params.imgUrl}`;
    const encodedText = encodeURIComponent(params.text + '\n');
    const encodedUrl = encodeURIComponent(holonotes_link_url);
    const url = `${base_url}url=${encodedUrl}&text=${encodedText}`;
    this.analyticsService.sendShareOnEvent('twitter');
    return this.openNewWindow(url);
  }

  shareOnFacebook(params: SocialShareParams): Window {
    if (!params) {
      return null;
    }
    if (params.pageName === 'preview') {
      this.setProjectAsPublic();
    }

    const base_url = 'https://www.facebook.com/sharer/sharer.php?';
    const encodedUrl = encodeURIComponent(params.linkUrl);
    const url = `${base_url}u=${encodedUrl}`;
    this.analyticsService.sendShareOnEvent('facebook');
    return this.openNewWindow(url, 800);
  }

  shareOnPinterest(params: SocialShareParams): Window {
    if (!params) {
      return null;
    }
    if (params.pageName === 'preview') {
      this.setProjectAsPublic();
    }

    const base_url = 'https://pinterest.com/pin/create/button/?';
    const encodedUrl = encodeURIComponent(params.linkUrl);
    const encodedDescription = encodeURIComponent(params.description);
    const encodedMedia = encodeURIComponent(params.imgUrl);
    const url = `${base_url}url=${encodedUrl}&description=${encodedDescription}&media=${encodedMedia}`;
    this.analyticsService.sendShareOnEvent('pinterest');
    return this.openNewWindow(url, 600);
  }

  shareOnWhatsapp(params: SocialShareParams): Window {
    if (!params) {
      return null;
    }
    if (params.pageName === 'preview') {
      this.setProjectAsPublic();
    }

    const base_url = 'https://wa.me/?';
    const encodedUrl = encodeURIComponent(params.linkUrl);
    const encodedDescription = encodeURIComponent(params.description);
    const url = `${base_url}text=${encodedDescription} ${encodedUrl}`;
    this.analyticsService.sendShareOnEvent('whatsapp');
    return this.openNewWindow(url, 600);
  }

  followOnTwitter() {
    const url = 'https://twitter.com/holonotes';
    this.openNewTab(url);
  }

  followOnFacebook() {
    const url = 'https://www.facebook.com/holonotes';
    this.openNewTab(url);
  }

  copyLinkUrl(el: HTMLInputElement, link?: string) {
    this.sharedService.copyLinkUrl(el, link);
  }

  mailto() {
    const url = 'mailto:contact@holonotes.io';
    this.openNewTab(url);
  }

  openNewTab(url: string, params = '') {
    try {
      window.open(url, '', params);
    } catch (error) {
      console.error(error);
    }
  }

  openNewWindow(url: string, windowHeight = 300): Window {
    const width = window.innerWidth;
    const height = window.innerHeight;
    let w: number, left: number;
    try {
      if (width < this.sharedService.MEDIUM_WINDOW_WIDTH) {
        w = width - 20;
        left = 0;
      } else {
        w = this.sharedService.MEDIUM_WINDOW_WIDTH;
        left = Number((width / 2) - (w / 2));
      }
      const h = windowHeight;
      const top = Number((height / 2)  - (h / 2));
      const params = `scrollbars=no,resizable=no,
      status=no,location=no,toolbar=no,menubar=no,
      width=${w},height=${h},left=${left},top=${top}`;
      return window.open(url, '', params);
    } catch (error) {
      console.error(error);
    }
  }

  setProjectAsPublic() {
    const project = this.sharedService.currentProject;
    if (!project || project.is_public) {
      return;
    }
    project.is_public = true;
    const data = {is_public: true};
    this.databaseService.updateProjectFields(project, data)
    .catch((error) => {
      console.error(error);
    });
  }

  buildLinkForPreview(project: Project): SocialShareParams {
    if (!project) {
      return null;
    }
    const text = project.artist ? `${project.name} - ${project.artist}` : project.name;
    const params: SocialShareParams = {
      linkUrl: `https://holonotes.io/project/${project.id}/preview`,
      text: text,
      description: project.preview_description,
      pageName: 'preview',
      imgUrl: project.cover_img
    };
    return params;
  }

  buildLinkForSharedChallenge(task: Task): SocialShareParams {
    const challenge = task && task.challenge  && task.challenge.shared_id ? task.challenge : null;
    if (!challenge) {
      return null;
    }
    let name = '';
    let text = task.name;
    let imgUrl = 'https://holonotes.io/assets/imgs/your-own-challenge.jpg';
    if (challenge.id === 'learn_song') {
      const defImgUrl = 'https://holonotes.io/assets/imgs/learn-a-song-min.jpg';
      text += challenge.project && challenge.project.artist ? ` by ${challenge.project.artist}` : '';
      imgUrl = challenge.project && challenge.project.imgUrl ? challenge.project.imgUrl : defImgUrl;
    } else if (challenge.id === 'new_song_each_time') {
      const img = 'https://holonotes.io/assets/imgs/learn-a-song-every-week-min.jpg';
      const wg = challenge.week_goal;
      let cImg = null;
      if (wg && wg.length > 0) {
        cImg = wg[wg.length - 1].image;
        const txt = wg[wg.length - 1].text ? wg[wg.length - 1].text.replace(/\s/g, '') : null;
        if (txt) {
          name = `/${txt}`;
        }
      }
      imgUrl = cImg || img;
    }

    const params: SocialShareParams = {
      linkUrl: `https://holonotes.io/challenges/${challenge.shared_id}/preview${name}`,
      text: text,
      description: challenge.description.join(' '),
      pageName: 'challenge',
      imgUrl: imgUrl
    };
    return params;
  }
}
