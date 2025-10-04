import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStateService } from '../services/auth-state.service';

export const loginGuard: CanActivateFn = () => {
  const authStateService = inject(AuthStateService);
  const router = inject(Router);

  // Si ya está autenticado, redirigir a wrap/home
  if (authStateService.isAuthenticated()) {
    router.navigate(['/wrap/home']);
    return false;
  }

  return true;
};
