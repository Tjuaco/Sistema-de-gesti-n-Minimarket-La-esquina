from rest_framework import serializers
from django.db import transaction
from .models import Venta, DetalleVenta
from inventario.models import Producto


class DetalleVentaSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    stock_disponible = serializers.IntegerField(source='producto.stock_actual', read_only=True)
    producto = serializers.PrimaryKeyRelatedField(queryset=Producto.objects.all())

    class Meta:
        model = DetalleVenta
        fields = '__all__'
        read_only_fields = ['subtotal', 'venta']


class VentaSerializer(serializers.ModelSerializer):
    items = DetalleVentaSerializer(many=True, read_only=True)
    total_calculado = serializers.SerializerMethodField()

    class Meta:
        model = Venta
        fields = '__all__'
        read_only_fields = ['total', 'fecha']

    def get_total_calculado(self, obj):
        return obj.calcular_total()


class CrearVentaSerializer(serializers.ModelSerializer):
    items = DetalleVentaSerializer(many=True)

    class Meta:
        model = Venta
        fields = ['numero_boleta', 'fecha', 'observaciones', 'items']
        extra_kwargs = {
            'fecha': {'required': False, 'allow_null': True},
            'observaciones': {'required': False, 'allow_null': True, 'allow_blank': True},
        }

    def validate(self, data):
        """Validar que todos los productos tengan stock suficiente y precio válido"""
        items_data = data.get('items', [])
        
        if not items_data:
            raise serializers.ValidationError({"items": "Debe agregar al menos un producto."})
        
        from decimal import Decimal
        
        for item_data in items_data:
            producto = item_data.get('producto')
            cantidad = item_data.get('cantidad')
            precio_unitario = item_data.get('precio_unitario')

            if not producto:
                raise serializers.ValidationError({"items": "Todos los items deben tener un producto."})

            # Convertir precio_unitario a Decimal
            if isinstance(precio_unitario, (int, float)):
                precio_unitario_decimal = Decimal(str(precio_unitario))
            elif isinstance(precio_unitario, str):
                precio_unitario_decimal = Decimal(precio_unitario)
            else:
                precio_unitario_decimal = precio_unitario

            # Actualizar el precio en los datos validados
            item_data['precio_unitario'] = precio_unitario_decimal

            # Validar stock suficiente
            if not producto.tiene_stock_suficiente(cantidad):
                raise serializers.ValidationError(
                    f"Stock insuficiente para {producto.nombre}. "
                    f"Stock disponible: {producto.stock_actual}, solicitado: {cantidad}"
                )

            # Validar precio no menor al costo
            if precio_unitario_decimal < producto.costo:
                raise serializers.ValidationError(
                    f"El precio de venta de {producto.nombre} no puede ser menor al costo "
                    f"(${producto.costo})."
                )

        return data

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        usuario = self.context['request'].user.username if self.context['request'].user.is_authenticated else 'Cajero'
        
        # Generar número de boleta automáticamente si no se proporciona o está vacío
        numero_boleta = validated_data.get('numero_boleta')
        if not numero_boleta or (isinstance(numero_boleta, str) and numero_boleta.strip() == ''):
            from django.utils import timezone
            fecha = validated_data.get('fecha') or timezone.now()
            # Formato: BOL-YYYYMMDD-XXXX (donde XXXX es un número secuencial del día)
            prefijo = f"BOL-{fecha.strftime('%Y%m%d')}"
            # Contar ventas del día con este prefijo
            ventas_hoy = Venta.objects.filter(
                numero_boleta__startswith=prefijo
            ).count()
            validated_data['numero_boleta'] = f"{prefijo}-{ventas_hoy + 1:04d}"
        
        # Establecer fecha por defecto si no se proporciona
        if 'fecha' not in validated_data or not validated_data.get('fecha'):
            from django.utils import timezone
            validated_data['fecha'] = timezone.now()
        
        try:
            with transaction.atomic():
                venta = Venta.objects.create(
                    **validated_data,
                    usuario=usuario
                )

                from decimal import Decimal
                total = Decimal('0.00')
                for item_data in items_data:
                    producto = item_data['producto']
                    cantidad = item_data['cantidad']
                    precio_unitario = item_data['precio_unitario']

                    # Calcular subtotal antes de crear el objeto
                    subtotal_calculado = Decimal(str(cantidad)) * Decimal(str(precio_unitario))
                    
                    detalle = DetalleVenta.objects.create(
                        venta=venta,
                        producto=producto,
                        cantidad=cantidad,
                        precio_unitario=precio_unitario,
                        subtotal=subtotal_calculado  # Calcular explícitamente el subtotal
                    )
                    
                    # Aplicar la venta (descuenta stock)
                    detalle.aplicar_venta()
                    # Usar el subtotal calculado
                    total += subtotal_calculado

                venta.total = total
                venta.save()

            return venta
        except ValueError as e:
            raise serializers.ValidationError(str(e))
        except Exception as e:
            import traceback
            traceback.print_exc()
            raise serializers.ValidationError(f"Error al crear la venta: {str(e)}")

    def update(self, instance, validated_data):
        """Actualizar una venta existente"""
        items_data = validated_data.pop('items', None)
        usuario = self.context['request'].user.username if self.context['request'].user.is_authenticated else 'Cajero'
        
        with transaction.atomic():
            # Revertir los cambios de stock de la venta original
            for detalle in instance.items.all():
                producto = detalle.producto
                stock_actual = producto.stock_actual
                stock_nuevo = stock_actual + detalle.cantidad  # Revertir: sumar lo que se había restado
                
                # Revertir stock
                producto.stock_actual = stock_nuevo
                producto.save()
                
                # Registrar movimiento de reversión
                from inventario.models import MovimientoStock
                MovimientoStock.objects.create(
                    producto=producto,
                    tipo='AJUSTE',
                    cantidad=detalle.cantidad,  # Positivo porque estamos revirtiendo
                    stock_anterior=stock_actual,
                    stock_nuevo=stock_nuevo,
                    motivo=f'Reversión de Venta #{instance.id}',
                    usuario=usuario
                )
            
            # Eliminar detalles antiguos
            instance.items.all().delete()
            
            # Actualizar datos de la venta
            numero_boleta = validated_data.get('numero_boleta')
            # Si no se proporciona un número de boleta y no existe uno previo, generarlo automáticamente
            if not numero_boleta or (isinstance(numero_boleta, str) and numero_boleta.strip() == ''):
                if not instance.numero_boleta or (isinstance(instance.numero_boleta, str) and instance.numero_boleta.strip() == ''):
                    from django.utils import timezone
                    fecha = timezone.now()
                    prefijo = f"BOL-{fecha.strftime('%Y%m%d')}"
                    ventas_hoy = Venta.objects.filter(
                        numero_boleta__startswith=prefijo
                    ).count()
                    instance.numero_boleta = f"{prefijo}-{ventas_hoy + 1:04d}"
                else:
                    instance.numero_boleta = instance.numero_boleta
            else:
                instance.numero_boleta = numero_boleta
            
            # Actualizar fecha si se proporciona
            if 'fecha' in validated_data and validated_data.get('fecha'):
                instance.fecha = validated_data['fecha']
            
            instance.observaciones = validated_data.get('observaciones', instance.observaciones)
            instance.usuario = usuario
            instance.save()
            
            # Crear nuevos detalles
            from decimal import Decimal
            total = Decimal('0.00')
            if items_data:
                for item_data in items_data:
                    producto = item_data['producto']
                    cantidad = item_data['cantidad']
                    precio_unitario = item_data['precio_unitario']

                    # Calcular subtotal antes de crear el objeto
                    subtotal_calculado = Decimal(str(cantidad)) * Decimal(str(precio_unitario))
                    
                    detalle = DetalleVenta.objects.create(
                        venta=instance,
                        producto=producto,
                        cantidad=cantidad,
                        precio_unitario=precio_unitario,
                        subtotal=subtotal_calculado  # Calcular explícitamente el subtotal
                    )
                    detalle.aplicar_venta()
                    # Usar el subtotal calculado
                    total += subtotal_calculado

                instance.total = total
                instance.save()

        return instance

