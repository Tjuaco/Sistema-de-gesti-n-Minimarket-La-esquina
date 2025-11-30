from rest_framework import serializers
from .models import Proveedor, Categoria, Producto, MovimientoStock, PedidoProveedor


class ProveedorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Proveedor
        fields = '__all__'


class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    categoria_nombre = serializers.CharField(source='categoria.nombre', read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    margen = serializers.SerializerMethodField()
    imagen_url = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'
        extra_kwargs = {
            'codigo': {'required': False, 'allow_blank': True},
            'imagen': {'required': False, 'allow_null': True},
            'codigo_barras': {'required': False, 'allow_null': True, 'allow_blank': True},
            'descripcion': {'required': False, 'allow_null': True, 'allow_blank': True},
            'categoria': {'required': False, 'allow_null': True},
            'proveedor': {'required': False, 'allow_null': True},
        }

    def to_internal_value(self, data):
        """Convertir strings vacíos a None para campos opcionales"""
        # Si es un MultiValueDict (FormData), convertir a dict normal
        if hasattr(data, 'getlist'):
            data_dict = {}
            for key in data.keys():
                values = data.getlist(key)
                if len(values) == 1:
                    value = values[0]
                    # Convertir strings vacíos a None para campos opcionales
                    if value == '' and key in ['codigo_barras', 'descripcion', 'categoria', 'proveedor']:
                        data_dict[key] = None
                    else:
                        data_dict[key] = value
                else:
                    data_dict[key] = values
            data = data_dict
        
        # También manejar dict normal
        if isinstance(data, dict):
            for key in ['codigo_barras', 'descripcion', 'categoria', 'proveedor']:
                if key in data and data[key] == '':
                    data[key] = None
        
        return super().to_internal_value(data)

    def get_margen(self, obj):
        return obj.margen()

    def get_imagen_url(self, obj):
        """Retorna la URL completa de la imagen"""
        if obj.imagen:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
            return obj.imagen.url
        return None

    def validate(self, data):
        """Validar que el precio de venta no sea menor al costo y generar código automáticamente"""
        from decimal import Decimal
        import uuid
        
        # Generar código automáticamente si no se proporciona (solo al crear)
        if not self.instance and (not data.get('codigo') or data.get('codigo', '').strip() == ''):
            # Generar código único basado en UUID (primeros 8 caracteres)
            codigo_generado = f"PROD-{uuid.uuid4().hex[:8].upper()}"
            # Asegurar que el código sea único
            while Producto.objects.filter(codigo=codigo_generado).exists():
                codigo_generado = f"PROD-{uuid.uuid4().hex[:8].upper()}"
            data['codigo'] = codigo_generado
        
        precio_venta = data.get('precio_venta')
        costo = data.get('costo')
        
        # Si no están en data, obtener de la instancia (para updates)
        if precio_venta is None and self.instance:
            precio_venta = self.instance.precio_venta
        if costo is None and self.instance:
            costo = self.instance.costo
        
        # Si aún no tenemos valores, obtener de initial_data
        if precio_venta is None and 'precio_venta' in self.initial_data:
            precio_venta = self.initial_data['precio_venta']
        if costo is None and 'costo' in self.initial_data:
            costo = self.initial_data['costo']
        
        if precio_venta is not None and costo is not None:
            # Convertir a Decimal si es necesario
            if isinstance(precio_venta, str):
                precio_venta = Decimal(precio_venta)
            elif isinstance(precio_venta, (int, float)):
                precio_venta = Decimal(str(precio_venta))
            
            if isinstance(costo, str):
                costo = Decimal(costo)
            elif isinstance(costo, (int, float)):
                costo = Decimal(str(costo))
            
            if precio_venta < costo:
                raise serializers.ValidationError({
                    'precio_venta': 'El precio de venta no puede ser menor al costo. '
                                  f'Costo actual: ${costo}, Precio ingresado: ${precio_venta}'
                })
        
        return data


class MovimientoStockSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    tipo_display = serializers.CharField(source='get_tipo_display', read_only=True)

    class Meta:
        model = MovimientoStock
        fields = '__all__'
        read_only_fields = ['stock_anterior', 'stock_nuevo', 'fecha']


class PedidoProveedorSerializer(serializers.ModelSerializer):
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    proveedor_email = serializers.CharField(source='proveedor.email', read_only=True)
    estado_display = serializers.CharField(source='get_estado_display', read_only=True)
    cantidad_productos = serializers.SerializerMethodField()

    class Meta:
        model = PedidoProveedor
        fields = '__all__'
        read_only_fields = ['fecha_envio']

    def get_cantidad_productos(self, obj):
        """Retorna la cantidad de productos diferentes en el pedido"""
        return len(obj.items) if obj.items else 0

