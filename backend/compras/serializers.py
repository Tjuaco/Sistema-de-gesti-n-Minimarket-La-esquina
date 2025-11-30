from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import Compra, DetalleCompra


class DetalleCompraSerializer(serializers.ModelSerializer):
    producto_nombre = serializers.CharField(source='producto.nombre', read_only=True)
    producto_codigo = serializers.CharField(source='producto.codigo', read_only=True)
    cantidad = serializers.IntegerField(required=False, default=1)
    costo_unitario = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=1)

    class Meta:
        model = DetalleCompra
        fields = ['producto', 'cantidad', 'costo_unitario', 'subtotal', 'producto_nombre', 'producto_codigo']
        read_only_fields = ['subtotal', 'producto_nombre', 'producto_codigo']
    
    def to_internal_value(self, data):
        """Convertir producto a ID si viene como objeto"""
        if 'producto' in data:
            # Si producto es un objeto (dict), extraer el ID
            if isinstance(data['producto'], dict):
                if 'id' in data['producto']:
                    data['producto'] = data['producto']['id']
            # Si producto es un objeto Producto, extraer el ID
            elif hasattr(data['producto'], 'id'):
                data['producto'] = data['producto'].id
        
        return super().to_internal_value(data)


class CompraSerializer(serializers.ModelSerializer):
    items = DetalleCompraSerializer(many=True, read_only=True)
    proveedor_nombre = serializers.CharField(source='proveedor.nombre', read_only=True)
    total_calculado = serializers.SerializerMethodField()

    class Meta:
        model = Compra
        fields = '__all__'
        read_only_fields = ['total', 'fecha']

    def get_total_calculado(self, obj):
        return obj.calcular_total()


class CrearCompraSerializer(serializers.ModelSerializer):
    items = DetalleCompraSerializer(many=True)

    class Meta:
        model = Compra
        fields = ['proveedor', 'fecha', 'observaciones', 'items']
        extra_kwargs = {
            'proveedor': {'required': False, 'allow_null': True},
            'fecha': {'required': False, 'allow_null': True},
            'observaciones': {'required': False, 'allow_null': True},
        }

    def validate_items(self, value):
        """Validar que haya al menos un item y que todos tengan producto válido"""
        if not value or len(value) == 0:
            raise serializers.ValidationError('Debe incluir al menos un producto en la compra.')
        
        for item in value:
            if 'producto' not in item or item['producto'] is None:
                raise serializers.ValidationError('Todos los items deben tener un producto válido.')
            
            # Asegurar que producto sea un ID (entero), no un objeto
            producto_id = item['producto']
            if hasattr(producto_id, 'id'):
                item['producto'] = producto_id.id
            elif isinstance(producto_id, dict) and 'id' in producto_id:
                item['producto'] = producto_id['id']
            # Convertir a entero si es necesario
            try:
                item['producto'] = int(item['producto'])
            except (ValueError, TypeError):
                raise serializers.ValidationError(f'El producto debe ser un ID válido (número entero).')
        
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        usuario = self.context['request'].user.username if self.context['request'].user.is_authenticated else 'Sistema'
        
        # Si no se proporciona fecha, usar la fecha actual
        if 'fecha' not in validated_data or validated_data.get('fecha') is None:
            from django.utils import timezone
            validated_data['fecha'] = timezone.now()
        
        # Generar número de factura automáticamente si no se proporciona o está vacío
        numero_factura = validated_data.get('numero_factura')
        if not numero_factura or (isinstance(numero_factura, str) and numero_factura.strip() == ''):
            fecha = validated_data.get('fecha')
            # Formato: FACT-YYYYMMDD-XXXX (donde XXXX es un número secuencial del día)
            prefijo = f"FACT-{fecha.strftime('%Y%m%d')}"
            # Contar compras del día con este prefijo
            compras_hoy = Compra.objects.filter(
                numero_factura__startswith=prefijo
            ).count()
            validated_data['numero_factura'] = f"{prefijo}-{compras_hoy + 1:04d}"
        
        with transaction.atomic():
            compra = Compra.objects.create(
                **validated_data,
                usuario=usuario
            )

            total = 0
            from inventario.models import Producto
            
            for item_data in items_data:
                # Obtener el ID del producto (puede venir como objeto o como ID)
                producto_id = item_data['producto']
                
                # Si es un objeto Producto, extraer el ID
                if hasattr(producto_id, 'id'):
                    producto_id = producto_id.id
                # Si es un diccionario, extraer el ID
                elif isinstance(producto_id, dict) and 'id' in producto_id:
                    producto_id = producto_id['id']
                # Asegurar que sea un entero
                producto_id = int(producto_id)
                
                try:
                    producto = Producto.objects.get(id=producto_id)
                except Producto.DoesNotExist:
                    raise serializers.ValidationError(f'El producto con ID {producto_id} no existe.')
                except (ValueError, TypeError):
                    raise serializers.ValidationError(f'El producto debe ser un ID válido. Se recibió: {type(producto_id).__name__}')
                
                # Usar valores por defecto si no se proporcionan
                cantidad = item_data.get('cantidad', 1)
                if cantidad is None or cantidad <= 0:
                    cantidad = 1
                
                costo_unitario = item_data.get('costo_unitario', 1)
                if costo_unitario is None or costo_unitario <= 0:
                    # Usar el costo del producto si está disponible
                    costo_unitario = float(producto.costo) if producto.costo and producto.costo > 0 else 1
                
                # Convertir a Decimal para asegurar compatibilidad
                costo_unitario = Decimal(str(costo_unitario))
                
                # Calcular subtotal antes de crear el objeto
                subtotal_calculado = Decimal(str(cantidad)) * costo_unitario

                detalle = DetalleCompra.objects.create(
                    compra=compra,
                    producto=producto,
                    cantidad=cantidad,
                    costo_unitario=costo_unitario,
                    subtotal=subtotal_calculado  # Calcular explícitamente el subtotal
                )
                detalle.aplicar_compra()
                # Usar el subtotal calculado
                total += float(subtotal_calculado)

            # Convertir total a Decimal para guardarlo correctamente
            compra.total = Decimal(str(total))
            compra.save()

        return compra

    def update(self, instance, validated_data):
        """Actualizar una compra existente"""
        items_data = validated_data.pop('items', None)
        usuario = self.context['request'].user.username if self.context['request'].user.is_authenticated else 'Sistema'
        
        with transaction.atomic():
            # Revertir los cambios de stock de la compra original
            for detalle in instance.items.all():
                producto = detalle.producto
                stock_actual = producto.stock_actual
                stock_nuevo = stock_actual - detalle.cantidad
                
                # Validar que no quede stock negativo
                if stock_nuevo < 0:
                    raise serializers.ValidationError(
                        f'No se puede revertir la compra. El producto {producto.nombre} '
                        f'tendría stock negativo ({stock_nuevo}).'
                    )
                
                # Revertir stock
                producto.stock_actual = stock_nuevo
                
                # Revertir costo (simplificado - en producción podría necesitar un historial de costos)
                # Por ahora, mantenemos el costo actual
                
                producto.save()
                
                # Registrar movimiento de reversión
                from inventario.models import MovimientoStock
                MovimientoStock.objects.create(
                    producto=producto,
                    tipo='AJUSTE',
                    cantidad=-detalle.cantidad,
                    stock_anterior=stock_actual,
                    stock_nuevo=stock_nuevo,
                    motivo=f'Reversión de Compra #{instance.id}',
                    usuario=usuario
                )
            
            # Eliminar detalles antiguos
            instance.items.all().delete()
            
            # Actualizar datos de la compra
            numero_factura = validated_data.get('numero_factura')
            # Si no se proporciona un número de factura y no existe uno previo, generarlo automáticamente
            if not numero_factura or (isinstance(numero_factura, str) and numero_factura.strip() == ''):
                if not instance.numero_factura or (isinstance(instance.numero_factura, str) and instance.numero_factura.strip() == ''):
                    fecha = validated_data.get('fecha', instance.fecha)
                    prefijo = f"FACT-{fecha.strftime('%Y%m%d')}"
                    compras_hoy = Compra.objects.filter(
                        numero_factura__startswith=prefijo
                    ).count()
                    instance.numero_factura = f"{prefijo}-{compras_hoy + 1:04d}"
                else:
                    instance.numero_factura = instance.numero_factura
            else:
                instance.numero_factura = numero_factura
            
            instance.proveedor = validated_data.get('proveedor', instance.proveedor)
            instance.fecha = validated_data.get('fecha', instance.fecha)
            instance.observaciones = validated_data.get('observaciones', instance.observaciones)
            instance.usuario = usuario
            instance.save()
            
            # Crear nuevos detalles
            total = 0
            if items_data:
                from inventario.models import Producto
                
                for item_data in items_data:
                    # Obtener el ID del producto (puede venir como objeto o como ID)
                    producto_id = item_data['producto']
                    
                    # Si es un objeto Producto, extraer el ID
                    if hasattr(producto_id, 'id'):
                        producto_id = producto_id.id
                    # Si es un diccionario, extraer el ID
                    elif isinstance(producto_id, dict) and 'id' in producto_id:
                        producto_id = producto_id['id']
                    # Asegurar que sea un entero
                    producto_id = int(producto_id)
                    
                    try:
                        producto = Producto.objects.get(id=producto_id)
                    except Producto.DoesNotExist:
                        raise serializers.ValidationError(f'El producto con ID {producto_id} no existe.')
                    except (ValueError, TypeError):
                        raise serializers.ValidationError(f'El producto debe ser un ID válido. Se recibió: {type(producto_id).__name__}')
                    
                    # Usar valores por defecto si no se proporcionan
                    cantidad = item_data.get('cantidad', 1)
                    if cantidad is None or cantidad <= 0:
                        cantidad = 1
                    
                    costo_unitario = item_data.get('costo_unitario', 1)
                    if costo_unitario is None or costo_unitario <= 0:
                        # Usar el costo del producto si está disponible
                        costo_unitario = float(producto.costo) if producto.costo and producto.costo > 0 else 1
                    
                    # Convertir a Decimal para asegurar compatibilidad
                    costo_unitario = Decimal(str(costo_unitario))
                    
                    # Calcular subtotal antes de crear el objeto
                    subtotal_calculado = Decimal(str(cantidad)) * costo_unitario

                    detalle = DetalleCompra.objects.create(
                        compra=instance,
                        producto=producto,
                        cantidad=cantidad,
                        costo_unitario=costo_unitario,
                        subtotal=subtotal_calculado  # Calcular explícitamente el subtotal
                    )
                    detalle.aplicar_compra()
                    # Usar el subtotal calculado
                    total += float(subtotal_calculado)

                # Convertir total a Decimal para guardarlo correctamente
                instance.total = Decimal(str(total))
                instance.save()

        return instance

