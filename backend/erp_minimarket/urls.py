"""
URL configuration for erp_minimarket project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/usuarios/', include('usuarios.urls')),
    path('api/inventario/', include('inventario.urls')),
    path('api/compras/', include('compras.urls')),
    path('api/ventas/', include('ventas.urls')),
    path('api/reportes/', include('reportes.urls')),
]

# Servir archivos media en desarrollo
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

