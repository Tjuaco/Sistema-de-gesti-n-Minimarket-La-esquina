from django.contrib.auth.models import AbstractUser
from django.db import models


class Usuario(AbstractUser):
    """Modelo de usuario personalizado con roles"""
    ROL_CHOICES = [
        ('CAJERO', 'Cajero'),
        ('BODEGUERO', 'Bodeguero'),
        ('ADMINISTRADOR', 'Administrador'),
    ]
    
    rol = models.CharField(
        max_length=20,
        choices=ROL_CHOICES,
        default='CAJERO',
        help_text='Rol del usuario en el sistema'
    )
    telefono = models.CharField(max_length=20, null=True, blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'
        ordering = ['username']

    def __str__(self):
        return f"{self.username} ({self.get_rol_display()})"

    def es_cajero(self):
        return self.rol == 'CAJERO'

    def es_bodeguero(self):
        return self.rol == 'BODEGUERO'

    def es_administrador(self):
        return self.rol == 'ADMINISTRADOR'

    def puede_ventas(self):
        """El cajero y administrador pueden registrar ventas"""
        return self.rol in ['CAJERO', 'ADMINISTRADOR']

    def puede_compras(self):
        """El bodeguero y administrador pueden registrar compras"""
        return self.rol in ['BODEGUERO', 'ADMINISTRADOR']

    def puede_productos(self):
        """Solo el administrador puede gestionar productos"""
        return self.rol == 'ADMINISTRADOR'

    def puede_reportes(self):
        """Solo el administrador puede ver reportes"""
        return self.rol == 'ADMINISTRADOR'


class AlertaStock(models.Model):
    """Modelo para alertas de stock bajo"""
    producto = models.ForeignKey(
        'inventario.Producto',
        on_delete=models.CASCADE,
        related_name='alertas'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    leida = models.BooleanField(default=False)
    fecha_lectura = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-fecha_creacion']
        indexes = [
            models.Index(fields=['leida', '-fecha_creacion']),
        ]

    def __str__(self):
        return f"Alerta: {self.producto.nombre} - Stock: {self.producto.stock_actual}"


class Configuracion(models.Model):
    """Modelo para configuraciones generales del sistema"""
    clave = models.CharField(
        max_length=100,
        unique=True,
        help_text='Clave única de la configuración'
    )
    valor = models.TextField(
        help_text='Valor de la configuración'
    )
    descripcion = models.CharField(
        max_length=255,
        blank=True,
        help_text='Descripción de la configuración'
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración'
        verbose_name_plural = 'Configuraciones'
        ordering = ['clave']

    def __str__(self):
        return f"{self.clave}: {self.valor[:50]}"

    @classmethod
    def obtener_valor(cls, clave, default=''):
        """Obtiene el valor de una configuración por su clave"""
        try:
            config = cls.objects.get(clave=clave)
            return config.valor
        except cls.DoesNotExist:
            return default

    @classmethod
    def establecer_valor(cls, clave, valor, descripcion=''):
        """Establece o actualiza el valor de una configuración"""
        config, created = cls.objects.get_or_create(
            clave=clave,
            defaults={'valor': valor, 'descripcion': descripcion}
        )
        if not created:
            config.valor = valor
            if descripcion:
                config.descripcion = descripcion
            config.save()
        return config
