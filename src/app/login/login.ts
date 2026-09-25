import { Component, computed, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth';

type Mode = 'signin' | 'signup';
type Phase = 'default' | 'submitting' | 'error' | 'confirm';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './login.css',
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly mode = signal<Mode>('signin');
  readonly phase = signal<Phase>('default');
  readonly errorText = signal('');

  readonly isSignup = computed(() => this.mode() === 'signup');
  readonly busy = computed(() => this.phase() === 'submitting');
  readonly failed = computed(() => this.phase() === 'error');

  readonly title = computed(() => (this.isSignup() ? 'Create your account' : 'Sign in'));
  readonly subtitle = computed(() =>
    this.isSignup()
      ? 'Use your work email. We will send a link to confirm it.'
      : 'Use your work email and password.',
  );
  readonly primaryLabel = computed(() => {
    if (this.busy()) return this.isSignup() ? 'Creating account…' : 'Signing in…';
    return this.isSignup() ? 'Create account' : 'Sign in';
  });
  readonly switchPrompt = computed(() =>
    this.isSignup() ? 'Already have an account?' : 'New to Crash Data?',
  );
  readonly switchLink = computed(() => (this.isSignup() ? 'Sign in' : 'Create an account'));

  clearError() {
    if (this.failed()) this.phase.set('default');
  }

  togglePassword() {
    this.showPassword.update((shown) => !shown);
  }

  switchMode() {
    this.mode.update((mode) => (mode === 'signup' ? 'signin' : 'signup'));
    this.phase.set('default');
    this.confirmPassword.set('');
  }

  backToSignIn() {
    this.mode.set('signin');
    this.phase.set('default');
    this.password.set('');
    this.confirmPassword.set('');
  }

  async submit() {
    if (this.busy()) return;
    const signup = this.isSignup();

    if (signup && this.password() !== this.confirmPassword()) {
      this.errorText.set('Those passwords do not match. Retype them and try again.');
      this.phase.set('error');
      return;
    }

    this.phase.set('submitting');

    const { data, error } = signup
      ? await this.auth.signUp(this.email(), this.password())
      : await this.auth.signIn(this.email(), this.password());

    if (error) {
      this.errorText.set(error.message);
      this.phase.set('error');
      return;
    }

    // Sign-up returns a session only when the project has email confirmation
    // switched off; otherwise the account waits on the emailed link.
    if (signup && !data.session) {
      this.phase.set('confirm');
      return;
    }

    await this.router.navigateByUrl('/');
  }

  async signInWithGoogle() {
    const { error } = await this.auth.signInWithGoogle();
    if (error) {
      this.errorText.set(error.message);
      this.phase.set('error');
    }
  }
}
