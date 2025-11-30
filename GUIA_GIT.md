# Guía para Crear Repositorio Git y Subir el Proyecto

## 📋 Pasos para Subir el Proyecto a GitHub

### Paso 1: Verificar que Git esté instalado

```bash
git --version
```

Si no está instalado, descárgalo desde: https://git-scm.com/downloads

---

### Paso 2: Inicializar el Repositorio Git

Desde la raíz del proyecto (donde están las carpetas `backend` y `frontend`):

```bash
git init
```

---

### Paso 3: Crear un archivo .gitignore en la raíz (si no existe)

El archivo `.gitignore` debe estar en la raíz del proyecto para ignorar archivos comunes.

**Contenido sugerido para `.gitignore` en la raíz:**

```
# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
venv/
env/
ENV/
.venv

# Django
*.log
*.pot
*.pyc
db.sqlite3
db.sqlite3-journal
/media
/staticfiles

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnp
.pnp.js

# Variables de entorno
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDEs
.vscode/
.idea/
*.swp
*.swo
*.sublime-project
*.sublime-workspace

# OS
.DS_Store
Thumbs.db
desktop.ini

# Build
/build
/dist
*.egg-info

# Logs
logs/
*.log

# Archivos temporales
*.tmp
*.temp
```

---

### Paso 4: Verificar archivos a agregar

```bash
git status
```

Esto mostrará todos los archivos que se agregarán al repositorio.

---

### Paso 5: Agregar todos los archivos al staging

```bash
git add .
```

O si quieres ser más selectivo:

```bash
git add backend/
git add frontend/
git add README.md
git add *.md
```

---

### Paso 6: Hacer el primer commit

```bash
git commit -m "Initial commit: Sistema ERP Minimarket La Esquina"
```

O un mensaje más descriptivo:

```bash
git commit -m "Initial commit: Sistema ERP para Minimarket La Esquina

- Backend Django con API REST
- Frontend React con Material-UI
- Gestión de productos, compras y ventas
- Sistema de autenticación con roles
- Reportes en Excel
- Trazabilidad completa de stock"
```

---

### Paso 7: Crear el Repositorio en GitHub

1. Ve a https://github.com
2. Inicia sesión en tu cuenta
3. Haz clic en el botón **"+"** (arriba a la derecha) → **"New repository"**
4. Completa:
   - **Repository name:** `erp-minimarket-la-esquina` (o el nombre que prefieras)
   - **Description:** "Sistema ERP para gestión de inventario, compras y ventas de un minimarket"
   - **Visibility:** 
     - **Public** (si quieres que sea público)
     - **Private** (si quieres que sea privado - recomendado para proyectos académicos)
   - **NO marques** "Initialize this repository with a README" (ya tienes uno)
   - **NO marques** "Add .gitignore" (ya tienes uno)
   - **NO marques** "Choose a license" (a menos que quieras agregar una licencia)
5. Haz clic en **"Create repository"**

---

### Paso 8: Conectar el Repositorio Local con GitHub

GitHub te mostrará comandos después de crear el repositorio. Usa estos comandos:

```bash
git remote add origin https://github.com/TU_USUARIO/erp-minimarket-la-esquina.git
```

**Reemplaza `TU_USUARIO` con tu nombre de usuario de GitHub.**

---

### Paso 9: Renombrar la rama principal (si es necesario)

Si tu rama se llama `master` y quieres cambiarla a `main`:

```bash
git branch -M main
```

---

### Paso 10: Subir el código a GitHub

```bash
git push -u origin main
```

O si tu rama se llama `master`:

```bash
git push -u origin master
```

Te pedirá tus credenciales de GitHub (usuario y contraseña o token de acceso personal).

---

## 🔐 Autenticación con GitHub

Si GitHub te pide autenticación, puedes usar:

### Opción 1: Token de Acceso Personal (Recomendado)

1. Ve a GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Genera un nuevo token con permisos `repo`
3. Usa ese token como contraseña cuando Git te lo pida

### Opción 2: GitHub CLI

```bash
gh auth login
```

### Opción 3: SSH (Más seguro para el futuro)

Genera una clave SSH y agrégala a tu cuenta de GitHub.

---

## ✅ Verificación

Después de hacer push, verifica que todo esté bien:

1. Ve a tu repositorio en GitHub
2. Deberías ver todos tus archivos
3. Verifica que los archivos sensibles (`.env`, `venv/`, `node_modules/`) NO estén visibles

---

## 📝 Comandos Útiles para el Futuro

### Ver el estado del repositorio:
```bash
git status
```

### Agregar cambios:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Ver el historial de commits:
```bash
git log
```

### Crear una nueva rama:
```bash
git checkout -b nombre-de-la-rama
```

### Cambiar de rama:
```bash
git checkout nombre-de-la-rama
```

### Ver ramas:
```bash
git branch
```

---

## ⚠️ IMPORTANTE: Antes de Subir

Verifica que estos archivos NO se suban (deben estar en .gitignore):

- ✅ `.env` (variables de entorno con credenciales)
- ✅ `venv/` o `env/` (entornos virtuales)
- ✅ `node_modules/` (dependencias de Node)
- ✅ `*.pyc` (archivos compilados de Python)
- ✅ `__pycache__/` (caché de Python)
- ✅ `media/` (archivos subidos por usuarios)
- ✅ `staticfiles/` (archivos estáticos compilados)
- ✅ `.DS_Store` (archivos del sistema macOS)
- ✅ `Thumbs.db` (archivos del sistema Windows)

---

## 🚨 Si Algo Sale Mal

### Si quieres deshacer el último commit (antes de hacer push):
```bash
git reset HEAD~1
```

### Si quieres eliminar archivos del staging:
```bash
git reset
```

### Si quieres ver qué archivos se van a subir:
```bash
git ls-files
```

---

## 📚 Recursos Adicionales

- [Documentación oficial de Git](https://git-scm.com/doc)
- [Guía de GitHub](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

¡Buena suerte con tu repositorio! 🚀

