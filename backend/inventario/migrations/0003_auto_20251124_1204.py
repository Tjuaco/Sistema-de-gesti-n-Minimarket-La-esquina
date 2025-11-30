# Generated manually

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('inventario', '0002_producto_imagen'),
    ]

    operations = [
        migrations.CreateModel(
            name='PedidoProveedor',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('fecha_envio', models.DateTimeField(auto_now_add=True)),
                ('fecha_estimada_entrega', models.DateField(blank=True, null=True)),
                ('estado', models.CharField(choices=[('ENVIADO', 'Enviado'), ('CONFIRMADO', 'Confirmado'), ('EN_TRANSITO', 'En Tránsito'), ('RECIBIDO', 'Recibido'), ('CANCELADO', 'Cancelado')], default='ENVIADO', max_length=20)),
                ('notas', models.TextField(blank=True, null=True)),
                ('email_enviado', models.EmailField(max_length=254)),
                ('usuario', models.CharField(max_length=100)),
                ('items', models.JSONField(default=list, help_text='Lista de productos solicitados')),
                ('total_items', models.IntegerField(default=0, help_text='Total de unidades solicitadas')),
                ('proveedor', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='pedidos', to='inventario.proveedor')),
            ],
            options={
                'verbose_name': 'Pedido a Proveedor',
                'verbose_name_plural': 'Pedidos a Proveedores',
                'ordering': ['-fecha_envio'],
            },
        ),
        migrations.AddIndex(
            model_name='pedidoproveedor',
            index=models.Index(fields=['-fecha_envio'], name='inventario__fecha_e_8a3f0a_idx'),
        ),
        migrations.AddIndex(
            model_name='pedidoproveedor',
            index=models.Index(fields=['proveedor', '-fecha_envio'], name='inventario__proveed_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='pedidoproveedor',
            index=models.Index(fields=['estado'], name='inventario__estado_789abc_idx'),
        ),
    ]
