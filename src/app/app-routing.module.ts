import { NgModule } from '@angular/core';
import { Routes, RouterModule, PreloadAllModules } from '@angular/router';
import { AuthGuard } from './core/auth.guard';
import { ProjectGuard } from './core/project.guard';

const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadChildren: './pages/home/home.module#HomePageModule'},
  { path: 'explore', loadChildren: './pages/explore/explore.module#ExplorePageModule'},
  { path: 'news-feed', loadChildren: './pages/news-feed/news-feed.module#NewsFeedPageModule'},
  { path: 'challenges', loadChildren: './pages/challenges/challenges.module#ChallengesPageModule'},
  { path: 'challenges/:id', loadChildren: './pages/challenges/challenges.module#ChallengesPageModule'},
  { path: 'challenges/:id/preview', loadChildren: './pages/challenges/challenges.module#ChallengesPageModule'},
  { path: 'challenges/:id/preview/:name', loadChildren: './pages/challenges/challenges.module#ChallengesPageModule'},
  { path: 'help', loadChildren: './pages/help/help.module#HelpPageModule'},
  { path: 'privacy', loadChildren: './pages/privacy/privacy.module#PrivacyPageModule'},
  { path: 'terms', loadChildren: './pages/terms/terms.module#TermsPageModule'},
  { path: 'contact', loadChildren: './pages/help/help.module#HelpPageModule'},
  { path: 'supportus', loadChildren: './pages/help/help.module#HelpPageModule'},
  { path: 'start', loadChildren: './pages/start/start.module#StartPageModule',
    canActivate: [AuthGuard], data: {not_logged_in: true} },
  { path: 'library', loadChildren: './pages/library/library.module#LibraryPageModule',
    canActivate: [AuthGuard] },
  { path: 'profile', loadChildren: './pages/profile/profile.module#ProfilePageModule',
    /* canActivate: [AuthGuard], data: {not_guest_logged_in: true} */ },
  { path: 'collections/:id', loadChildren:
    './pages/collections/collections.module#CollectionsPageModule',
    canActivate: [AuthGuard] },
  { path: 'project/:id', loadChildren: './pages/project/project.module#ProjectPageModule',
    canActivate: [ProjectGuard] },
  { path: 'project/:id/preview', loadChildren: './pages/project/project.module#ProjectPageModule',
    canActivate: [ProjectGuard]},
  { path: 'project/:id/challenges/:scid', loadChildren: './pages/project/project.module#ProjectPageModule',
    canActivate: [ProjectGuard]},
  { path: 'notifications',
    loadChildren: './pages/notifications/notifications.module#NotificationsPageModule',
    canActivate: [AuthGuard] },
  { path: 'create-project/:id', loadChildren:
    './pages/create-project/create-project.module#CreateProjectPageModule',
    canActivate: [AuthGuard] },
  { path: 'activity', loadChildren:
    './pages/motivation/tasks/tasks.module#TasksPageModule',
    canActivate: [AuthGuard] },
  { path: 'journey', loadChildren:
    './pages/journey/journey.module#JourneyPageModule',
    canActivate: [AuthGuard] },
  { path: 'journal', loadChildren:
    './pages/journal/journal.module#JournalPageModule',
    canActivate: [AuthGuard] },
  { path: 'journal/:id', loadChildren:
    './pages/journal/journal.module#JournalPageModule',
    canActivate: [AuthGuard] },
  // Default redirect route rule if non of the above matches
  { path: '**', redirectTo: 'home', pathMatch: 'full' }

];

@NgModule({
  imports: [RouterModule.forRoot(routes, {preloadingStrategy: PreloadAllModules})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
