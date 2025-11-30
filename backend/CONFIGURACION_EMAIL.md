# Configuración de Correo Electrónico

Este documento explica cómo configurar el envío de correos electrónicos para la funcionalidad de envío de pedidos a proveedores.

**⚠️ IMPORTANTE DE SEGURIDAD**: 
- El archivo `.env` está en `.gitignore` y **NO se subirá a Git**
- **NUNCA** subas credenciales de correo al repositorio
- Las credenciales solo deben estar en tu archivo `.env` local

## Error Común: "Username and Password not accepted"

Si recibes el error `(535, b'5.7.8 Username and Password not accepted')`, significa que las credenciales de Gmail no están configuradas correctamente.

## Solución: Usar Contraseña de Aplicación (App Password)

Gmail requiere usar una **Contraseña de aplicación** en lugar de tu contraseña normal cuando se usa autenticación de dos pasos o para aplicaciones externas.

### Pasos para Configurar:

1. **Habilita la verificación en dos pasos** (si no la tienes):
   - Ve a: https://myaccount.google.com/security
   - Activa la "Verificación en dos pasos"

2. **Genera una Contraseña de aplicación**:
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" como aplicación
   - Selecciona "Otro (nombre personalizado)" como dispositivo
   - Escribe "ERP Minimarket" o el nombre que prefieras
   - Haz clic en "Generar"
   - **Copia la contraseña de 16 caracteres** (sin espacios)

3. **Configura las variables de entorno**:
   
   Crea un archivo `.env` en la carpeta `backend/` con el siguiente contenido:

   ```env
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=tu-email@gmail.com
   EMAIL_HOST_PASSWORD=tu-contraseña-de-aplicación-aqui
   DEFAULT_FROM_EMAIL=tu-email@gmail.com
   ```

   **Importante**: 
   - Reemplaza `tu-email@gmail.com` con tu email de Gmail
   - Reemplaza `tu-contraseña-de-aplicación-aqui` con la contraseña de 16 caracteres que generaste (sin espacios)

4. **Reinicia el servidor Django**:
   ```bash
   python manage.py runserver
   ```

## Alternativa: Usar Otro Proveedor de Correo

Si prefieres usar otro proveedor de correo (como Outlook, Yahoo, etc.), ajusta las siguientes variables en tu archivo `.env`:

### Outlook/Office 365:
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

### Yahoo:
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
```

## Verificación

Para verificar que la configuración funciona:

1. Inicia el servidor Django
2. Ve a la sección de Proveedores en el frontend
3. Selecciona un proveedor con email
4. Haz clic en "Enviar Pedido"
5. Agrega productos y envía el correo

Si todo está configurado correctamente, deberías ver el mensaje "Correo enviado exitosamente".

## Solución de Problemas

### Error: "Connection refused"
- Verifica tu conexión a internet
- Verifica que el puerto 587 no esté bloqueado por un firewall

### Error: "Timeout"
- Verifica que `EMAIL_HOST` y `EMAIL_PORT` sean correctos
- Intenta cambiar `EMAIL_USE_TLS` a `False` si usas el puerto 465 (aunque esto no es recomendado)

### Error: "Authentication failed"
- Asegúrate de estar usando una Contraseña de aplicación, no tu contraseña normal
- Verifica que la verificación en dos pasos esté habilitada
- Genera una nueva contraseña de aplicación si la anterior no funciona

