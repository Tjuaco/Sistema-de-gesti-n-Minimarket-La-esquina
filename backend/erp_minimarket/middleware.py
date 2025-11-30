"""
Middleware personalizado para deshabilitar CSRF en rutas de API
"""
from django.utils.deprecation import MiddlewareMixin


class DisableCSRFForAPI(MiddlewareMixin):
    """
    Middleware que deshabilita la verificación CSRF para todas las rutas que empiezan con /api/
    """
    def process_request(self, request):
        if request.path.startswith('/api/'):
            setattr(request, '_dont_enforce_csrf_checks', True)



