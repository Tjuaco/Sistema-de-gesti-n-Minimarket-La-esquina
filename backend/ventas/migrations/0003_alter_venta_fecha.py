# Generated manually to allow editing fecha field

from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):

    dependencies = [
        ('ventas', '0002_add_subtotal_to_detalleventa'),
    ]

    operations = [
        migrations.AlterField(
            model_name='venta',
            name='fecha',
            field=models.DateTimeField(default=django.utils.timezone.now),
        ),
    ]



