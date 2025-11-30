# ERP Minimarket La Esquina

Sistema ERP para gestión de inventario, compras y ventas de un minimarket.

## Tecnologías

- **Backend**: Django 4.2 + Django REST Framework
- **Frontend**: React 18 + Material-UI
- **Base de Datos**: PostgreSQL

## Estructura del Proyecto

```
.
├── backend/                 # Backend Django
│   ├── erp_minimarket/     # Configuración del proyecto
│   ├── inventario/         # App de inventario (Productos, Proveedores)
│   ├── compras/            # App de compras
│   ├── ventas/             # App de ventas
│   ├── usuarios/           # App de usuarios y autenticación
│   ├── reportes/           # App de reportes
│   ├── media/              # Archivos subidos (imágenes de productos)
│   ├── env.example.txt     # Ejemplo de archivo .env
│   ├── setup_local.bat     # Script de configuración para Windows
│   └── setup_local.sh      # Script de configuración para Linux/Mac
└── frontend/               # Frontend React
    ├── src/
    │   ├── components/     # Componentes reutilizables
    │   ├── pages/          # Páginas principales
    │   ├── services/        # Servicios API
    │   ├── context/         # Contextos de React (Auth, Theme)
    │   └── utils/          # Utilidades
    └── public/
```

## Instalación

### Backend

**Requisitos previos**: 
- Python 3.8 o superior instalado
- PostgreSQL instalado y corriendo
- pip instalado (viene con Python)

**Opción rápida (Windows)**:
```bash
cd backend
setup_local.bat
```

**Opción rápida (Linux/Mac)**:
```bash
cd backend
chmod +x setup_local.sh
./setup_local.sh
```

**Instalación manual**:

1. Navegar a la carpeta backend:
```bash
cd backend
```

2. Crear un entorno virtual:
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Instalar dependencias:
```bash
pip install -r requirements.txt
```

4. **Configurar variables de entorno** (crear archivo `.env`):
   
   **Opción 1: Copiar archivo de ejemplo**
   ```bash
   # En Windows (PowerShell)
   Copy-Item env.example.txt .env
   
   # En Linux/Mac
   cp env.example.txt .env
   ```
   
   **Opción 2: Crear manualmente**
   
   Crea un archivo `.env` en la carpeta `backend/` con las siguientes variables:
   
   ```env
   # Configuración de Django
   SECRET_KEY=django-insecure-change-me-in-production-generate-a-secure-key
   DEBUG=True
   
   # Base de Datos PostgreSQL
   DB_NAME=minimarket_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   DB_HOST=localhost
   DB_PORT=5432
   
   # Correo Electrónico (opcional, necesario para enviar pedidos a proveedores)
   EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USE_TLS=True
   EMAIL_HOST_USER=tu-email@gmail.com
   EMAIL_HOST_PASSWORD=tu-contraseña-de-aplicación
   DEFAULT_FROM_EMAIL=tu-email@gmail.com
   ```
   
   **⚠️ IMPORTANTE**: 
   - El archivo `.env` está en `.gitignore` y **NO se subirá a Git** (tus credenciales están seguras)
   - Para Gmail, necesitas usar una "Contraseña de aplicación" (no tu contraseña normal)
   - Consulta `backend/CONFIGURACION_EMAIL.md` para instrucciones detalladas
   - Si no configuras el correo, la funcionalidad de envío de pedidos no funcionará, pero el resto del sistema sí
   - **IMPORTANTE**: Asegúrate de cambiar el `SECRET_KEY` por uno seguro antes de usar en producción

5. **Configurar PostgreSQL**:
   
   Asegúrate de tener PostgreSQL instalado y corriendo. Luego:
   
   ```bash
   # Conectar a PostgreSQL (como usuario postgres)
   psql -U postgres
   
   # Crear la base de datos
   CREATE DATABASE minimarket_db;
   
   # Salir de psql
   \q
   ```
   
   Actualiza las credenciales en el archivo `.env` si tu configuración de PostgreSQL es diferente.

6. **Ejecutar migraciones**:
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Crear superusuario** (usuario administrador):
```bash
python manage.py createsuperuser
```
   Sigue las instrucciones para crear el usuario administrador. Este usuario tendrá acceso completo al sistema.

8. **Ejecutar servidor de desarrollo**:
```bash
python manage.py runserver
```

   El backend estará disponible en `http://localhost:8000`
   
   **Nota**: Si el puerto 8000 está ocupado, puedes usar otro puerto:
   ```bash
   python manage.py runserver 8001
   ```

9. **Verificar que el servidor funciona**:
   - Abre tu navegador y ve a `http://localhost:8000/admin/`
   - Deberías ver la página de administración de Django
   - Inicia sesión con el superusuario creado en el paso 7

### Frontend

**Requisitos previos**: 
- Node.js instalado (versión 14 o superior)
- npm instalado (viene con Node.js)

1. **Navegar a la carpeta frontend**:
```bash
cd frontend
```

2. **Instalar dependencias**:
```bash
npm install
```
   Esto puede tardar varios minutos la primera vez.

3. **Verificar que el backend esté corriendo**:
   - El frontend necesita que el backend esté ejecutándose en `http://localhost:8000`
   - Si el backend está en otro puerto, actualiza `frontend/src/services/api.js`

4. **Ejecutar servidor de desarrollo**:
```bash
npm start
```

   El frontend estará disponible en `http://localhost:3000` y se abrirá automáticamente en tu navegador.

   **Nota**: Si el puerto 3000 está ocupado, npm te preguntará si quieres usar otro puerto.

5. **Iniciar sesión**:
   - Usa las credenciales del superusuario creado en el backend
   - O crea un nuevo usuario desde la página de registro

## Funcionalidades MVP

### ✅ Implementadas

- **Gestión de Productos**: CRUD completo de productos con código, nombre, precio, costo, stock
- **Gestión de Proveedores**: CRUD de proveedores
- **Registro de Compras**: Creación de compras que actualizan automáticamente el stock
- **Registro de Ventas**: Creación de ventas que descuentan automáticamente el stock
- **Validaciones de Negocio**:
  - No permite stock negativo
  - No permite precio de venta menor al costo
  - Valida stock suficiente antes de vender
- **Trazabilidad**: Registro de movimientos de stock
- **Dashboard**: Vista de productos con stock bajo y ventas recientes

### 🔄 Pendientes (Post-MVP)

- Alertas automáticas de bajo stock
- Reportes detallados (diarios, semanales, mensuales)
- Lector de código de barras
- Autenticación y roles de usuario (Cajero, Bodeguero, Administrador)
- Exportación CSV

## Uso de la API

### Autenticación

Todas las rutas de la API requieren autenticación (excepto login y registro).

**Login:**
```bash
POST /api/usuarios/login/
Body: { "username": "usuario", "password": "contraseña" }
```

**Obtener usuario actual:**
```bash
GET /api/usuarios/usuario-actual/
```

**Logout:**
```bash
POST /api/usuarios/logout/
```

### Endpoints principales

**Inventario:**
- `GET /api/inventario/productos/` - Listar productos
- `POST /api/inventario/productos/` - Crear producto (solo admin)
- `GET /api/inventario/productos/{id}/` - Detalle de producto
- `PUT /api/inventario/productos/{id}/` - Actualizar producto (solo admin)
- `DELETE /api/inventario/productos/{id}/` - Eliminar producto (solo admin)
- `POST /api/inventario/productos/{id}/ajustar_stock/` - Ajustar stock (solo admin)
- `GET /api/inventario/productos/bajo_stock/` - Productos con stock bajo
- `GET /api/inventario/proveedores/` - Listar proveedores
- `POST /api/inventario/proveedores/` - Crear proveedor (solo admin)

**Compras:**
- `GET /api/compras/` - Listar compras (bodeguero y admin)
- `POST /api/compras/` - Crear compra (bodeguero y admin)
- `GET /api/compras/{id}/` - Detalle de compra

**Ventas:**
- `GET /api/ventas/` - Listar ventas (cajero y admin)
- `POST /api/ventas/` - Crear venta (cajero y admin)
- `GET /api/ventas/{id}/` - Detalle de venta

**Usuarios:**
- `POST /api/usuarios/registro/` - Registrar nuevo usuario
- `GET /api/usuarios/csrf-token/` - Obtener token CSRF

## Reglas de Negocio

1. **Stock Negativo**: No se permite vender más productos de los que hay en stock
2. **Precio Mínimo**: El precio de venta no puede ser menor al costo
3. **Actualización de Costo**: Al comprar, el costo se actualiza usando promedio ponderado
4. **Trazabilidad**: Todos los movimientos de stock se registran con fecha, usuario y motivo

## Desarrollo

### Backend

Ejecutar tests (cuando se implementen):
```bash
python manage.py test
```

### Frontend

El proyecto usa React Query para gestión de estado del servidor y Material-UI para componentes.

## Solución de Problemas Comunes

### Backend no inicia

**Error: "No module named 'decouple'"**
```bash
# Asegúrate de tener el entorno virtual activado y las dependencias instaladas
pip install -r requirements.txt
```

**Error: "FATAL: database 'minimarket_db' does not exist"**
```bash
# Crea la base de datos en PostgreSQL
psql -U postgres
CREATE DATABASE minimarket_db;
\q
```

**Error: "could not connect to server"**
- Verifica que PostgreSQL esté corriendo
- En Windows: Busca "Services" y verifica que "postgresql-x64-XX" esté corriendo
- Verifica las credenciales en el archivo `.env`

**Error: "ModuleNotFoundError: No module named 'psycopg2'"**
```bash
# Instala psycopg2-binary (ya está en requirements.txt)
pip install psycopg2-binary
```

### Frontend no se conecta al backend

**Error: "Network Error" o "ERR_CONNECTION_REFUSED"**
- Verifica que el backend esté corriendo en `http://localhost:8000`
- Verifica que el puerto 8000 no esté ocupado por otra aplicación
- Si el backend está en otro puerto, actualiza `frontend/src/services/api.js`

**Error: "CORS policy"**
- El backend ya tiene CORS configurado para `localhost:3000`
- Si usas otro puerto, actualiza `CORS_ALLOWED_ORIGINS` en `backend/erp_minimarket/settings.py`

### Problemas con imágenes de productos

- Las imágenes se guardan en `backend/media/productos/`
- Asegúrate de que la carpeta `media` exista en `backend/`
- En desarrollo, las imágenes se sirven automáticamente desde `/media/`

### No puedo iniciar sesión

- Verifica que hayas creado un superusuario con `python manage.py createsuperuser`
- Si olvidaste la contraseña, puedes crear otro superusuario o usar el admin de Django
- Verifica que el backend esté corriendo y accesible

## Notas

- Este es un MVP para presentación
- La autenticación está implementada con sesiones de Django
- Para producción, considerar:
  - Autenticación JWT o similar
  - Manejo de errores más robusto
  - Validaciones adicionales
  - Tests automatizados
  - Optimización de consultas a BD
  - Configuración de HTTPS
  - Cambiar DEBUG=False y configurar SECRET_KEY seguro

