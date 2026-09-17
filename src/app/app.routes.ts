import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { Crashes } from './crashes/crashes';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', component: Crashes },
      { path: 'crashes', component: Crashes },
    ],
  },
];
