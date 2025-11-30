@echo off
REM Script de configuración inicial para Windows
echo ========================================
echo Configuracion inicial del Backend
echo ========================================
echo.

REM Verificar si existe el archivo .env
if not exist .env (
    echo [INFO] Creando archivo .env desde env.example.txt...
    if exist env.example.txt (
        copy env.example.txt .env
        echo [OK] Archivo .env creado. Por favor, editalo con tus credenciales.
    ) else (
        echo [ERROR] No se encontro env.example.txt
        echo [INFO] Por favor, crea manualmente el archivo .env
    )
) else (
    echo [INFO] El archivo .env ya existe.
)

REM Crear carpetas necesarias
echo [INFO] Creando carpetas necesarias...
if not exist media mkdir media
if not exist media\productos mkdir media\productos
if not exist staticfiles mkdir staticfiles
echo [OK] Carpetas creadas.

REM Verificar entorno virtual
if not exist venv (
    echo [INFO] Creando entorno virtual...
    python -m venv venv
    echo [OK] Entorno virtual creado.
) else (
    echo [INFO] El entorno virtual ya existe.
)

echo.
echo ========================================
echo Siguientes pasos:
echo ========================================
echo 1. Activa el entorno virtual: venv\Scripts\activate
echo 2. Instala las dependencias: pip install -r requirements.txt
echo 3. Configura el archivo .env con tus credenciales
echo 4. Crea la base de datos PostgreSQL: minimarket_db
echo 5. Ejecuta las migraciones: python manage.py migrate
echo 6. Crea un superusuario: python manage.py createsuperuser
echo 7. Inicia el servidor: python manage.py runserver
echo ========================================
pause

