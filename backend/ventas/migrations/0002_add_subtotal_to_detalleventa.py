# Generated manually to add subtotal field to DetalleVenta

from django.db import migrations, models
from decimal import Decimal


def calcular_subtotal_existente(apps, schema_editor):
    """Calcula el subtotal para los registros existentes"""
    DetalleVenta = apps.get_model('ventas', 'DetalleVenta')
    for detalle in DetalleVenta.objects.all():
        detalle.subtotal = Decimal(str(detalle.cantidad)) * Decimal(str(detalle.precio_unitario))
        detalle.save()


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='detalleventa',
            name='subtotal',
            field=models.DecimalField(
                decimal_places=2,
                max_digits=12,
                null=True,  # Temporalmente nullable para permitir la migración
                blank=True
            ),
        ),
        migrations.RunPython(calcular_subtotal_existente, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='detalleventa',
            name='subtotal',
            field=models.DecimalField(
                decimal_places=2,
                max_digits=12,
                null=False,
                blank=False
            ),
        ),
    ]



