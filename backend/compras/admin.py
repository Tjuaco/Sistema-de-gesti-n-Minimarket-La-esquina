from django.contrib import admin
from .models import Compra, DetalleCompra


class DetalleCompraInline(admin.TabularInline):
    model = DetalleCompra
    extra = 1


@admin.register(Compra)
class CompraAdmin(admin.ModelAdmin):
    list_display = ['id', 'numero_factura', 'proveedor', 'fecha', 'total', 'usuario']
    list_filter = ['fecha', 'proveedor']
    search_fields = ['numero_factura', 'proveedor__nombre']
    readonly_fields = ['fecha', 'total']
    inlines = [DetalleCompraInline]


@admin.register(DetalleCompra)
class DetalleCompraAdmin(admin.ModelAdmin):
    list_display = ['compra', 'producto', 'cantidad', 'costo_unitario', 'subtotal']
    list_filter = ['compra__fecha']

