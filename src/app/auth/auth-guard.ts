import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { supabase } from './supabase';

export const authGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const { data } = await supabase.auth.getSession();
  return data.session !== null ? true : router.createUrlTree(['/login']);
};
