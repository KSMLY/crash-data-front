import { computed, Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

@Injectable({ providedIn: 'root' })
export class Auth {
  private readonly session = signal<Session | null>(null);

  readonly isSignedIn = computed(() => this.session() !== null);
  readonly email = computed(() => this.session()?.user.email ?? null);

  constructor() {
    supabase.auth.onAuthStateChange((_event, session) => this.session.set(session));
  }

  token(): string | null {
    return this.session()?.access_token ?? null;
  }

  signIn(email: string, password: string) {
    return supabase.auth.signInWithPassword({ email, password });
  }

  signUp(email: string, password: string) {
    return supabase.auth.signUp({ email, password });
  }

  signOut() {
    return supabase.auth.signOut();
  }

  signInWithGoogle() {
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  }
}
