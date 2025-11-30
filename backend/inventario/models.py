from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal


class Proveedor(models.Model):
    """Modelo para proveedores"""
    nombre = models.CharField(max_length=200)
    rut = models.CharField(max_length=20, unique=True, null=True, blank=True)
    contacto = models.CharField(max_length=200, null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        verbose_name_plural = 'Proveedores'

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    """Modelo para categorías de productos"""
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['nombre']
        verbose_name_plural = 'Categorías'

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """Modelo para productos"""
    codigo = models.CharField(max_length=50, unique=True, db_index=True)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(null=True, blank=True)
    categoria = models.ForeignKey(Categoria, on_delete=models.SET_NULL, null=True, blank=True)
    proveedor = models.ForeignKey(Proveedor, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Precios y costos
    costo = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    precio_venta = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(Decimal('0.01'))]
    )
    
    # Stock
    stock_actual = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    stock_minimo = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0)]
    )
    
    # Información adicional
    codigo_barras = models.CharField(max_length=50, null=True, blank=True, unique=True)
    unidad_medida = models.CharField(max_length=20, default='UN')
    imagen = models.ImageField(upload_to='productos/', null=True, blank=True)
    activo = models.BooleanField(default=True)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['codigo']),
            models.Index(fields=['codigo_barras']),
            models.Index(fields=['activo']),
        ]

    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def tiene_stock_suficiente(self, cantidad):
        """Verifica si hay stock suficiente"""
        return self.stock_actual >= cantidad

    def esta_bajo_stock_minimo(self):
        """Verifica si el stock está por debajo del mínimo"""
        return self.stock_actual <= self.stock_minimo

    def margen(self):
        """Calcula el margen de ganancia"""
        if self.costo > 0:
            return ((self.precio_venta - self.costo) / self.costo) * 100
        return 0


class MovimientoStock(models.Model):
    """Modelo para registrar movimientos de stock"""
    TIPO_CHOICES = [
        ('ENTRADA', 'Entrada'),
        ('SALIDA', 'Salida'),
        ('AJUSTE', 'Ajuste'),
    ]
    
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE, related_name='movimientos')
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    stock_anterior = models.IntegerField()
    stock_nuevo = models.IntegerField()
    motivo = models.CharField(max_length=200)
    usuario = models.CharField(max_length=100)
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-fecha']
        indexes = [
            models.Index(fields=['producto', '-fecha']),
            models.Index(fields=['tipo', '-fecha']),
        ]

    def __str__(self):
        return f"{self.producto.codigo} - {self.tipo} - {self.cantidad}"


class PedidoProveedor(models.Model):
    """Modelo para registrar pedidos enviados a proveedores"""
    ESTADO_CHOICES = [
        ('ENVIADO', 'Enviado'),
        ('CONFIRMADO', 'Confirmado'),
        ('EN_TRANSITO', 'En Tránsito'),
        ('RECIBIDO', 'Recibido'),
        ('CANCELADO', 'Cancelado'),
    ]
    
    proveedor = models.ForeignKey(Proveedor, on_delete=models.CASCADE, related_name='pedidos')
    fecha_envio = models.DateTimeField(auto_now_add=True)
    fecha_estimada_entrega = models.DateField(null=True, blank=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='ENVIADO')
    notas = models.TextField(null=True, blank=True)
    email_enviado = models.EmailField()
    usuario = models.CharField(max_length=100)
    items = models.JSONField(default=list, help_text='Lista de productos solicitados')
    total_items = models.IntegerField(default=0, help_text='Total de unidades solicitadas')
    
    class Meta:
        ordering = ['-fecha_envio']
        verbose_name = 'Pedido a Proveedor'
        verbose_name_plural = 'Pedidos a Proveedores'
        indexes = [
            models.Index(fields=['-fecha_envio']),
            models.Index(fields=['proveedor', '-fecha_envio']),
            models.Index(fields=['estado']),
        ]

    def __str__(self):
        return f"Pedido #{self.id} - {self.proveedor.nombre} - {self.fecha_envio.strftime('%Y-%m-%d %H:%M')}"

