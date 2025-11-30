from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Usuario, Configuracion


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para mostrar información del usuario"""
    rol_display = serializers.CharField(source='get_rol_display', read_only=True)
    
    class Meta:
        model = Usuario
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'rol', 'rol_display', 'telefono', 'activo']
        read_only_fields = ['id', 'username']


class LoginSerializer(serializers.Serializer):
    """Serializer para login"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            if not user.is_active:
                raise serializers.ValidationError('Usuario inactivo')
            data['user'] = user
        else:
            raise serializers.ValidationError('Debe proporcionar username y password')
        
        return data


class RegistroSerializer(serializers.ModelSerializer):
    """Serializer para registro de nuevos usuarios"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)
    
    class Meta:
        model = Usuario
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'rol', 'telefono']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'telefono': {'required': False},
        }
    
    def validate(self, data):
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Las contraseñas no coinciden'})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = Usuario.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user


class ConfiguracionSerializer(serializers.ModelSerializer):
    """Serializer para configuraciones del sistema"""
    
    class Meta:
        model = Configuracion
        fields = ['id', 'clave', 'valor', 'descripcion', 'fecha_creacion', 'fecha_actualizacion']
        read_only_fields = ['id', 'fecha_creacion', 'fecha_actualizacion']

