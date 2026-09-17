import { Routes } from '@angular/router';
import { Shell } from './shell/shell';
import { CrashList } from './crash-list/crash-list';

export const routes: Routes = [
  {
    path: '',
    component: Shell,
    children: [
      { path: '', component: CrashList },
      { path: 'crashes', component: CrashList },
    ],
  },
];
