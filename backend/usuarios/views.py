from django.shortcuts import render
from django.middleware.csrf import get_token
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone
from django.contrib.auth import login, logout
from .models import AlertaStock, Usuario, Configuracion
from .serializers import UsuarioSerializer, LoginSerializer, RegistroSerializer, ConfiguracionSerializer
from .permissions import (
    PuedeVentas, PuedeCompras, PuedeProductos, PuedeReportes,
    EsAdministrador
)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Endpoint para login"""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        login(request, user)
        user_serializer = UsuarioSerializer(user)
        return Response({
            'user': user_serializer.data,
            'message': 'Login exitoso'
        })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Endpoint para logout"""
    logout(request)
    return Response({'message': 'Logout exitoso'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """Endpoint para obtener el usuario actual"""
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def csrf_token(request):
    """Endpoint para obtener el token CSRF"""
    token = get_token(request)
    return Response({'csrfToken': token})


@api_view(['POST'])
@permission_classes([AllowAny])
def registro_view(request):
    """Endpoint para registro de nuevos usuarios"""
    serializer = RegistroSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Auto-login después del registro
        login(request, user)
        user_serializer = UsuarioSerializer(user)
        return Response({
            'user': user_serializer.data,
            'message': 'Registro exitoso'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AlertaStockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.SerializerMethodField()
    producto_codigo = serializers.SerializerMethodField()
    stock_actual = serializers.SerializerMethodField()
    stock_minimo = serializers.SerializerMethodField()

    class Meta:
        model = AlertaStock
        fields = '__all__'
        read_only_fields = ['fecha_creacion']

    def get_producto_nombre(self, obj):
        """Obtener nombre del producto de forma segura"""
        try:
            return obj.producto.nombre if obj.producto else None
        except Exception:
            return None

    def get_producto_codigo(self, obj):
        """Obtener código del producto de forma segura"""
        try:
            return obj.producto.codigo if obj.producto else None
        except Exception:
            return None

    def get_stock_actual(self, obj):
        """Obtener stock actual del producto de forma segura"""
        try:
            return obj.producto.stock_actual if obj.producto else None
        except Exception:
            return None

    def get_stock_minimo(self, obj):
        """Obtener stock mínimo del producto de forma segura"""
        try:
            return obj.producto.stock_minimo if obj.producto else None
        except Exception:
            return None


class AlertaStockViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet para gestionar alertas de stock bajo"""
    queryset = AlertaStock.objects.filter(producto__activo=True).select_related('producto')
    serializer_class = AlertaStockSerializer
    permission_classes = [IsAuthenticated]  # Todos los autenticados pueden ver alertas

    def get_queryset(self):
        # Filtrar solo alertas con productos activos
        queryset = AlertaStock.objects.filter(
            producto__activo=True
        ).select_related('producto')
        leida = self.request.query_params.get('leida', None)
        
        if leida is not None:
            queryset = queryset.filter(leida=leida.lower() == 'true')
        
        return queryset.order_by('-fecha_creacion')

    @action(detail=True, methods=['post'])
    def marcar_leida(self, request, pk=None):
        """Marca una alerta como leída"""
        alerta = self.get_object()
        alerta.leida = True
        alerta.fecha_lectura = timezone.now()
        alerta.save()
        
        serializer = self.get_serializer(alerta)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def marcar_todas_leidas(self, request):
        """Marca todas las alertas no leídas como leídas"""
        try:
            actualizadas = AlertaStock.objects.filter(
                leida=False,
                producto__activo=True
            ).update(
                leida=True,
                fecha_lectura=timezone.now()
            )
            
            return Response({
                'mensaje': f'Se marcaron {actualizadas} alertas como leídas'
            })
        except Exception as e:
            return Response(
                {'error': f'Error al marcar alertas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def no_leidas(self, request):
        """Obtiene todas las alertas no leídas"""
        try:
            # Filtrar solo alertas con productos activos
            alertas = AlertaStock.objects.filter(
                leida=False,
                producto__activo=True
            ).select_related('producto').order_by('-fecha_creacion')
            serializer = self.get_serializer(alertas, many=True)
            return Response(serializer.data)
        except Exception as e:
            return Response(
                {'error': f'Error al obtener alertas: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def contar_no_leidas(self, request):
        """Cuenta las alertas no leídas"""
        try:
            # Contar solo alertas con productos activos
            cantidad = AlertaStock.objects.filter(
                leida=False,
                producto__activo=True
            ).count()
            return Response({'cantidad': cantidad})
        except Exception as e:
            return Response(
                {'error': f'Error al contar alertas: {str(e)}', 'cantidad': 0},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ConfiguracionViewSet(viewsets.ModelViewSet):
    """ViewSet para gestionar configuraciones del sistema"""
    queryset = Configuracion.objects.all()
    serializer_class = ConfiguracionSerializer
    permission_classes = [IsAuthenticated, EsAdministrador]  # Solo administradores

    def get_queryset(self):
        """Permite filtrar por clave"""
        queryset = Configuracion.objects.all()
        clave = self.request.query_params.get('clave', None)
        if clave:
            queryset = queryset.filter(clave=clave)
        return queryset.order_by('clave')

    @action(detail=False, methods=['get'])
    def obtener_direccion(self, request):
        """Obtiene la dirección del minimarket"""
        direccion = Configuracion.obtener_valor('direccion_minimarket', '')
        return Response({'direccion': direccion})

    @action(detail=False, methods=['post'])
    def establecer_direccion(self, request):
        """Establece la dirección del minimarket"""
        direccion = request.data.get('direccion', '')
        if not direccion:
            return Response(
                {'error': 'La dirección no puede estar vacía'},
                status=status.HTTP_400_BAD_REQUEST
            )
        Configuracion.establecer_valor(
            'direccion_minimarket',
            direccion,
            'Dirección del minimarket para incluir en correos a proveedores'
        )
        return Response({
            'mensaje': 'Dirección actualizada exitosamente',
            'direccion': direccion
        })
