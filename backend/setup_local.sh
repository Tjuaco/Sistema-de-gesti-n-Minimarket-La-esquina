#!/bin/bash
# Script de configuración inicial para Linux/Mac

echo "========================================"
echo "Configuracion inicial del Backend"
echo "========================================"
echo ""

# Verificar si existe el archivo .env
if [ ! -f .env ]; then
    echo "[INFO] Creando archivo .env desde env.example.txt..."
    if [ -f env.example.txt ]; then
        cp env.example.txt .env
        echo "[OK] Archivo .env creado. Por favor, edítalo con tus credenciales."
    else
        echo "[ERROR] No se encontró env.example.txt"
        echo "[INFO] Por favor, crea manualmente el archivo .env"
    fi
else
    echo "[INFO] El archivo .env ya existe."
fi

# Crear carpetas necesarias
echo "[INFO] Creando carpetas necesarias..."
mkdir -p media/productos
mkdir -p staticfiles
echo "[OK] Carpetas creadas."

# Verificar entorno virtual
if [ ! -d venv ]; then
    echo "[INFO] Creando entorno virtual..."
    python3 -m venv venv
    echo "[OK] Entorno virtual creado."
else
    echo "[INFO] El entorno virtual ya existe."
fi

echo ""
echo "========================================"
echo "Siguientes pasos:"
echo "========================================"
echo "1. Activa el entorno virtual: source venv/bin/activate"
echo "2. Instala las dependencias: pip install -r requirements.txt"
echo "3. Configura el archivo .env con tus credenciales"
echo "4. Crea la base de datos PostgreSQL: minimarket_db"
echo "5. Ejecuta las migraciones: python manage.py migrate"
echo "6. Crea un superusuario: python manage.py createsuperuser"
echo "7. Inicia el servidor: python manage.py runserver"
echo "========================================"

