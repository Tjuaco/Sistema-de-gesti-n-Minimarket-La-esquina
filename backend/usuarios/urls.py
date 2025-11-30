from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AlertaStockViewSet, ConfiguracionViewSet, login_view, logout_view, usuario_actual, csrf_token, registro_view

router = DefaultRouter()
router.register(r'alertas', AlertaStockViewSet, basename='alertas')
router.register(r'configuraciones', ConfiguracionViewSet, basename='configuraciones')

urlpatterns = [
    path('', include(router.urls)),
    path('csrf-token/', csrf_token, name='csrf-token'),
    path('login/', login_view, name='login'),
    path('logout/', logout_view, name='logout'),
    path('registro/', registro_view, name='registro'),
    path('usuario-actual/', usuario_actual, name='usuario-actual'),
]




