import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  nav = [
    { label: 'Overview', icon: 'space_dashboard', path: '/', exact: true },
    { label: 'Crashes', icon: 'table_rows', path: '/crashes', exact: false },
  ];
}
