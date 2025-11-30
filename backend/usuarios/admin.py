from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Usuario, AlertaStock


@admin.register(Usuario)
class UsuarioAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'rol', 'activo', 'fecha_creacion']
    list_filter = ['rol', 'activo', 'is_staff']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Información adicional', {
            'fields': ('rol', 'telefono', 'activo')
        }),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Información adicional', {
            'fields': ('rol', 'telefono', 'activo')
        }),
    )


@admin.register(AlertaStock)
class AlertaStockAdmin(admin.ModelAdmin):
    list_display = ['producto', 'fecha_creacion', 'leida']
    list_filter = ['leida', 'fecha_creacion']
    readonly_fields = ['fecha_creacion']
