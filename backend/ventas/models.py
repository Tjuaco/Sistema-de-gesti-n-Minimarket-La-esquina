from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from inventario.models import Producto, MovimientoStock
from django.db import transaction
from django.utils import timezone


class Venta(models.Model):
    """Modelo para ventas"""
    numero_boleta = models.CharField(max_length=50, unique=True, null=True, blank=True)
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
            models.Index(fields=['numero_boleta']),
        ]

    def __str__(self):
        return f"Venta #{self.id} - {self.fecha.strftime('%Y-%m-%d %H:%M')}"

    def calcular_total(self):
        """Calcula el total de la venta"""
        # Usar el campo subtotal directamente (no el método)
        return sum(item.subtotal for item in self.items.all())


class DetalleVenta(models.Model):
    """Modelo para detalles de venta"""
    venta = models.ForeignKey(Venta, on_delete=models.CASCADE, related_name='items')
    producto = models.ForeignKey(Producto, on_delete=models.PROTECT)
    cantidad = models.IntegerField(validators=[MinValueValidator(1)])
    precio_unitario = models.DecimalField(
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
        unique_together = ['venta', 'producto']

    def __str__(self):
        return f"{self.venta} - {self.producto.nombre} x{self.cantidad}"

    def save(self, *args, **kwargs):
        """Calcula el subtotal antes de guardar"""
        from decimal import Decimal
        # Calcular subtotal antes de guardar
        if self.cantidad and self.precio_unitario:
            self.subtotal = Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))
        super().save(*args, **kwargs)

    def calcular_subtotal(self):
        """Retorna el subtotal calculado"""
        from decimal import Decimal
        if self.cantidad and self.precio_unitario:
            return Decimal(str(self.cantidad)) * Decimal(str(self.precio_unitario))
        return Decimal('0.00')

    def aplicar_venta(self):
        """Aplica la venta descontando stock"""
        # No usar transaction.atomic() aquí porque ya estamos dentro de una transacción
        producto = self.producto
        stock_anterior = producto.stock_actual
        stock_nuevo = stock_anterior - self.cantidad

        # Validar stock negativo
        if stock_nuevo < 0:
            raise ValueError(f"Stock insuficiente para {producto.nombre}. Stock disponible: {stock_anterior}")

        # Actualizar stock
        producto.stock_actual = stock_nuevo
        producto.save()

        # Registrar movimiento
        # Usar el ID de la venta si está disponible, sino usar un mensaje genérico
        venta_id = self.venta.id if self.venta.id else 'Nueva'
        motivo = f'Venta #{venta_id}'
        usuario_venta = self.venta.usuario if hasattr(self.venta, 'usuario') and self.venta.usuario else 'Sistema'
        
        MovimientoStock.objects.create(
            producto=producto,
            tipo='SALIDA',
            cantidad=self.cantidad,
            stock_anterior=stock_anterior,
            stock_nuevo=stock_nuevo,
            motivo=motivo,
            usuario=usuario_venta
        )

        # Verificar si debe crear alerta de bajo stock
        self._verificar_alerta_stock(producto, stock_anterior, stock_nuevo)

    def _verificar_alerta_stock(self, producto, stock_anterior, stock_nuevo):
        """Verifica si debe crear alertas de stock bajo"""
        try:
            from usuarios.models import AlertaStock
            from django.utils import timezone
            
            # Si el stock anterior estaba por encima del mínimo y ahora está por debajo
            if stock_anterior > producto.stock_minimo and stock_nuevo <= producto.stock_minimo:
                # Crear nueva alerta solo si no hay una alerta sin leer
                if not AlertaStock.objects.filter(producto=producto, leida=False).exists():
                    AlertaStock.objects.create(producto=producto)
        except ImportError:
            # Si el modelo de alertas no existe aún, no hacer nada
            pass

