from django.contrib import admin
from .models import Venta, DetalleVenta


class DetalleVentaInline(admin.TabularInline):
    model = DetalleVenta
    extra = 1


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = ['id', 'numero_boleta', 'fecha', 'total', 'usuario']
    list_filter = ['fecha']
    search_fields = ['numero_boleta']
    readonly_fields = ['fecha', 'total']
    inlines = [DetalleVentaInline]


@admin.register(DetalleVenta)
class DetalleVentaAdmin(admin.ModelAdmin):
    list_display = ['venta', 'producto', 'cantidad', 'precio_unitario', 'subtotal']
    list_filter = ['venta__fecha']

