from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProveedorViewSet,
    CategoriaViewSet,
    ProductoViewSet,
    MovimientoStockViewSet,
    PedidoProveedorViewSet
)

router = DefaultRouter()
router.register(r'proveedores', ProveedorViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'productos', ProductoViewSet)
router.register(r'movimientos', MovimientoStockViewSet)
router.register(r'pedidos-proveedores', PedidoProveedorViewSet, basename='pedidos-proveedores')

urlpatterns = [
    path('', include(router.urls)),
]

