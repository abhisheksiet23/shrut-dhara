import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SessionService } from './core/session.service';
import { StudyService } from './core/study.service';
import { UiService } from './core/ui.service';

const studyGuard: CanActivateFn = () => {
  if (inject(SessionService).owned() && inject(StudyService).ready()) return true;
  inject(UiService).notify('To read or listen, choose “Use this window” first.');
  return inject(Router).createUrlTree(['/library']);
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((module) => module.Home) },
  {
    path: 'acharanga',
    loadComponent: () => import('./pages/acharanga').then((module) => module.Acharanga),
  },
  {
    path: 'library',
    loadComponent: () => import('./pages/library').then((module) => module.Library),
  },
  {
    path: 'study',
    loadComponent: () => import('./pages/study').then((module) => module.Study),
  },
  {
    path: 'preview/read/:id',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/reader').then((module) => module.Reader),
  },
  {
    path: 'read',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/sutra-reader').then((module) => module.SutraReader),
  },
  {
    path: 'read/:id',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/sutra-reader').then((module) => module.SutraReader),
  },
  // Older shared links to the single-chapter page now open the listening journey.
  { path: 'listen/shastraparijna', redirectTo: 'listen', pathMatch: 'full' },
  {
    path: 'listen/commentary',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/commentary').then((module) => module.Listen),
  },
  {
    path: 'listen',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/sutra-listen').then((module) => module.SutraListen),
  },
  {
    path: 'listen/:id',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/sutra-listen').then((module) => module.SutraListen),
  },
  {
    path: 'bookmarks',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/bookmarks').then((module) => module.Bookmarks),
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings').then((module) => module.Settings),
  },
  { path: '**', redirectTo: 'library' },
];
