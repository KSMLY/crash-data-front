import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { Crashes } from './crashes/crashes';
import { Overview } from './overview/overview';
import { authGuard } from './auth/auth-guard';
import { Login } from './login/login';
import { Report } from './report/report';

export const routes: Routes = [
  {
    path: 'login',
    component: Login,
  },
  {
    path: '',
    component: Shell,
    canActivate: [authGuard],
    children: [
      { path: '', component: Overview },
      { path: 'crashes', component: Crashes },
      { path: 'report', component: Report },
    ],
  },
];
