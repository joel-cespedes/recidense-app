import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Obtener token del localStorage
  const token = localStorage.getItem('access_token');

  // Si no hay token o es la petición de login, continuar sin modificar
  if (!token || req.url.includes('/auth/login')) {
    return next(req);
  }

  // Clonar la petición y agregar el header Authorization
  const clonedRequest = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });

  return next(clonedRequest);
};
