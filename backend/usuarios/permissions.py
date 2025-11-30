from rest_framework import permissions


class EsCajero(permissions.BasePermission):
    """Permiso para verificar que el usuario es Cajero"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'CAJERO'
        )


class EsBodeguero(permissions.BasePermission):
    """Permiso para verificar que el usuario es Bodeguero"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'BODEGUERO'
        )


class EsAdministrador(permissions.BasePermission):
    """Permiso para verificar que el usuario es Administrador"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ADMINISTRADOR'
        )


class PuedeVentas(permissions.BasePermission):
    """Permiso para verificar que el usuario puede registrar ventas (Cajero o Administrador)"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.puede_ventas()
        )


class PuedeCompras(permissions.BasePermission):
    """Permiso para verificar que el usuario puede registrar compras (Bodeguero o Administrador)"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.puede_compras()
        )


class PuedeProductos(permissions.BasePermission):
    """Permiso para verificar que el usuario puede gestionar productos (Solo Administrador)"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.puede_productos()
        )


class PuedeReportes(permissions.BasePermission):
    """Permiso para verificar que el usuario puede ver reportes (Solo Administrador)"""
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.puede_reportes()
        )


class EsAdministradorOReadOnly(permissions.BasePermission):
    """Permiso que permite lectura a todos los autenticados, pero escritura solo a administradores"""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user and
            request.user.is_authenticated and
            request.user.rol == 'ADMINISTRADOR'
        )



