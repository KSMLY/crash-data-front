import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.html',
  styleUrl: './shell.css',
})
export class Shell {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly email = this.auth.email;
  readonly initials = computed(() => (this.email() ?? '?').slice(0, 2).toUpperCase());

  nav = [
    { label: 'Overview', icon: 'space_dashboard', path: '/', exact: true },
    { label: 'Crashes', icon: 'table_rows', path: '/crashes', exact: false },
  ];

  async signOut() {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
