from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from django.utils import timezone
from inventario.models import Proveedor, Producto, MovimientoStock
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver


class Compra(models.Model):
    """Modelo para compras de productos"""
    numero_factura = models.CharField(max_length=50, null=True, blank=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.PROTECT, null=True, blank=True)
    fecha = models.DateTimeField(default=timezone.now)
    total = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=Decimal('0.00')
    )
    usuario = models.CharField(max_length=100)
    observaciones = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['-fecha']),
            models.Index(fields=['proveedor', '-fecha']),
        ]

    def __str__(self):
        return f"Compra #{self.id} - {self.proveedor.nombre} - {self.fecha.strftime('%Y-%m-%d')}"

    def calcular_total(self):
        """Calcula el total de la compra"""
        # Usar el campo subtotal directamente (no el método)
        return sum(item.subtotal for item in self.items.all())


class DetalleCompra(models.Model):
    """Modelo para detalles de compra"""
    compra = models.ForeignKey(Compra, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField(validators=[MinValueValidator(1)])
    costo_unitario = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    subtotal = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=False,
        blank=False
    )

    class Meta:
        unique_together = ['compra', 'producto']

    def __str__(self):
        return f"{self.compra} - {self.producto.nombre} x{self.cantidad}"

    def save(self, *args, **kwargs):
        """Calcula el subtotal antes de guardar"""
        from decimal import Decimal
        # Calcular subtotal antes de guardar
        if self.cantidad and self.costo_unitario:
            self.subtotal = Decimal(str(self.cantidad)) * Decimal(str(self.costo_unitario))
        super().save(*args, **kwargs)

    def calcular_subtotal(self):
        """Retorna el subtotal calculado"""
        from decimal import Decimal
        if self.cantidad and self.costo_unitario:
            return Decimal(str(self.cantidad)) * Decimal(str(self.costo_unitario))
        return Decimal('0.00')

    def aplicar_compra(self):
        """Aplica la compra al stock y actualiza el costo del producto"""
        # No usar transaction.atomic() aquí porque ya estamos dentro de una transacción
        producto = self.producto
        stock_anterior = producto.stock_actual
        stock_nuevo = stock_anterior + self.cantidad

        # Actualizar stock
        producto.stock_actual = stock_nuevo

        # Actualizar costo (promedio ponderado)
        if stock_nuevo > 0:
            from decimal import Decimal
            # Asegurar que todos los valores sean Decimal
            costo_anterior = Decimal(str(producto.costo))
            stock_ant = Decimal(str(stock_anterior))
            costo_nuevo = Decimal(str(self.costo_unitario))
            cantidad_nueva = Decimal(str(self.cantidad))
            stock_nuevo_decimal = Decimal(str(stock_nuevo))
            
            # Calcular costo promedio ponderado
            costo_anterior_total = costo_anterior * stock_ant
            costo_nuevo_total = costo_nuevo * cantidad_nueva
            producto.costo = (costo_anterior_total + costo_nuevo_total) / stock_nuevo_decimal

        producto.save()

        # Registrar movimiento
        # Usar el ID de la compra si está disponible, sino usar un mensaje genérico
        compra_id = self.compra.id if self.compra.id else 'Nueva'
        motivo = f'Compra #{compra_id}'
        usuario_compra = self.compra.usuario if hasattr(self.compra, 'usuario') and self.compra.usuario else 'Sistema'
        
        MovimientoStock.objects.create(
            producto=producto,
            tipo='ENTRADA',
            cantidad=self.cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            motivo=motivo,
            usuario=usuario_compra
        )

        # Verificar si debe crear o eliminar alerta de bajo stock
        self._verificar_alerta_stock(producto, stock_anterior, stock_nuevo)

    def _verificar_alerta_stock(self, producto, stock_anterior, stock_nuevo):
        """Verifica si debe crear o eliminar alertas de stock bajo"""
        try:
            from usuarios.models import AlertaStock
            from django.utils import timezone
            
            # Si el stock anterior estaba por encima del mínimo y ahora está por debajo
            if stock_anterior > producto.stock_minimo and stock_nuevo <= producto.stock_minimo:
                # Crear nueva alerta solo si no hay una alerta sin leer
                if not AlertaStock.objects.filter(producto=producto, leida=False).exists():
                    AlertaStock.objects.create(producto=producto)
            # Si el stock estaba por debajo y ahora está por encima, marcar alertas como leídas
            elif stock_anterior <= producto.stock_minimo and stock_nuevo > producto.stock_minimo:
                AlertaStock.objects.filter(producto=producto, leida=False).update(
                    leida=True,
                    fecha_lectura=timezone.now()
                )
        except ImportError:
            # Si el modelo de alertas no existe aún, no hacer nada
            pass

