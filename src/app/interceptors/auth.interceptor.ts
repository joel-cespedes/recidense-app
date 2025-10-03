import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('access_token');
  const router = inject(Router);

  if (!token || req.url.includes('/auth/login')) {
    return next(req);
  }

  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest).pipe(
    tap({
      error: error => {
        if (error.status === 401) {
          // Limpiar tokens y datos de usuario
          localStorage.removeItem('access_token');
          localStorage.removeItem('user_info');
          localStorage.removeItem('selected_residence');

          // Redirigir al login
          router.navigate(['/login']);
        }
      }
    })
  );
};
