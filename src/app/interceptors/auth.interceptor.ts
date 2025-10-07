import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);
  const authStateService = inject(AuthStateService);

  if (!token || req.url.includes('/auth/login')) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Limpiar tokens y estado
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('selected_residence');

        // Limpiar estado de autenticación
        authStateService.clearAuth();

        // Redirigir al login
        router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
