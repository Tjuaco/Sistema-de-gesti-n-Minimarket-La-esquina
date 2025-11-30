"""
Decoradores personalizados para deshabilitar CSRF en APIs REST
"""
from functools import wraps
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator


def csrf_exempt_api(view_func):
    """
    Decorador para deshabilitar CSRF en vistas de API REST
    Compatible con @api_view de Django REST Framework
    """
    @wraps(view_func)
    @csrf_exempt
    def wrapped_view(*args, **kwargs):
        return view_func(*args, **kwargs)
    return wrapped_view



