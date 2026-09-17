import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { Crashes } from './crashes/crashes';
import { Overview } from './overview/overview';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', component: Overview },
      { path: 'crashes', component: Crashes },
    ],
  },
];
