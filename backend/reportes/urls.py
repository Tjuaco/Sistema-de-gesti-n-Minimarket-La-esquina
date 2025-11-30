from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportesViewSet

router = DefaultRouter()
router.register(r'', ReportesViewSet, basename='reportes')

urlpatterns = [
    path('', include(router.urls)),
]




