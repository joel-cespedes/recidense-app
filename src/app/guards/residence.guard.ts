import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const residenceGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const selectedResidence = localStorage.getItem('selected_residence');

  // Si hay residencia seleccionada, permitir acceso
  if (selectedResidence) {
    return true;
  }

  // Si no hay residencia, redirigir a select-residences
  router.navigate(['/wrap/select-residences']);
  return false;
};
