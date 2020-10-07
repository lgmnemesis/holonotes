import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { SharedService } from '../services/shared.service';
import { DatabaseService } from '../services/database.service';
import { take } from 'rxjs/operators';
import { Project } from '../interfaces/project';

@Injectable({
  providedIn: 'root'
})
export class ProjectGuard implements CanActivate {

  constructor(private router: Router,
    private sharedService: SharedService,
    private databaseService: DatabaseService) { }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
      const project = this.sharedService.currentProject;
      if (project) {
        return project.is_public || this.databaseService.getMyUserId() === project.user_id;
      } else {
        // 1. Retrieve from database
        // 2. Check if the project is public
        // 3. if all of the above is true, put the object in currentPorject var and return true
        const id: string = next.params.id;
        const scid: string = next.params.scid;
        return this.checkDb(id, !!scid);
      }
  }

  async checkDb(id: string, isSharedChallengeProject = false) {
    let query: Promise<Project>;
    if (isSharedChallengeProject) {
      query = this.databaseService.getSharedChallengesProjectAsObservable(id)
       .pipe(take(1)).toPromise();
    } else {
      query = this.databaseService.getProjectAsObservable(id)
       .pipe(take(1)).toPromise();
    }
    return await query.then((project: Project) => {
        if (project && project.is_public) {
          this.sharedService.currentProject = project;
          return true;
        }
        this.router.navigate(['/explore']);
        return false;
      })
      .catch((error) => {
        console.error(error);
        this.router.navigate(['/explore']);
        return false;
      });
  }

}
