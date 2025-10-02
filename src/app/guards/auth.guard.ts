import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authStateService = inject(AuthStateService);

  if (authStateService.isAuthenticated()) {
    return true;
  }

  // Redirigir a login
  router.navigate(['/login']);
  return false;
};
