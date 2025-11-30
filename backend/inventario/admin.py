from django.contrib import admin
from .models import Proveedor, Categoria, Producto, MovimientoStock, PedidoProveedor


@admin.register(Proveedor)
class ProveedorAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'rut', 'contacto', 'telefono', 'activo']
    list_filter = ['activo']
    search_fields = ['nombre', 'rut', 'contacto']


@admin.register(Categoria)
class CategoriaAdmin(admin.ModelAdmin):
    list_display = ['nombre', 'activa']
    list_filter = ['activa']
    search_fields = ['nombre']


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ['codigo', 'nombre', 'categoria', 'stock_actual', 'stock_minimo', 'precio_venta', 'activo']
    list_filter = ['activo', 'categoria']
    search_fields = ['codigo', 'nombre', 'codigo_barras']
    readonly_fields = ['fecha_creacion', 'fecha_actualizacion']


@admin.register(MovimientoStock)
class MovimientoStockAdmin(admin.ModelAdmin):
    list_display = ['producto', 'tipo', 'cantidad', 'stock_anterior', 'stock_nuevo', 'fecha', 'usuario']
    list_filter = ['tipo', 'fecha']
    search_fields = ['producto__codigo', 'producto__nombre']
    readonly_fields = ['fecha']


@admin.register(PedidoProveedor)
class PedidoProveedorAdmin(admin.ModelAdmin):
    list_display = ['id', 'proveedor', 'fecha_envio', 'estado', 'total_items', 'usuario']
    list_filter = ['estado', 'fecha_envio']
    search_fields = ['proveedor__nombre', 'email_enviado', 'usuario']
    readonly_fields = ['fecha_envio']

