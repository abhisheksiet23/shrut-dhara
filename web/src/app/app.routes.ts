import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { SessionService } from './core/session.service';
import { StudyService } from './core/study.service';
import { UiService } from './core/ui.service';

const studyGuard: CanActivateFn = () => {
  if (inject(SessionService).owned() && inject(StudyService).ready()) return true;
  inject(UiService).notify('Study के लिए पहले Use this window चुनें।');
  return inject(Router).createUrlTree(['/library']);
};

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/home').then((module) => module.Home) },
  {
    path: 'library',
    loadComponent: () => import('./pages/library').then((module) => module.Library),
  },
  {
    path: 'read',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/reader').then((module) => module.Reader),
  },
  {
    path: 'read/:id',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/reader').then((module) => module.Reader),
  },
  {
    path: 'listen',
    canActivate: [studyGuard],
    loadComponent: () => import('./pages/listen').then((module) => module.Listen),
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
