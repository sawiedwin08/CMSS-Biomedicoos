# CMSS-Biomédico

Sistema de gestión integral para control de equipos biomédicos, mantenimiento, inventario y recursos humanos en instituciones de salud.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecutar el Proyecto](#ejecutar-el-proyecto)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Comandos Útiles](#comandos-útiles)

---

## 🔧 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

### Sistema Operativo
- **Windows 10+** o **macOS 10.14+** o **Linux (Ubuntu 18.04+)**

### Herramientas Principales

| Herramienta | Versión | Instalación |
|------------|---------|------------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **Python** | 3.10+ | [python.org](https://www.python.org/) |
| **PostgreSQL** | 12+ | [postgresql.org](https://www.postgresql.org/) |
| **Git** | Última | [git-scm.com](https://git-scm.com/) |

### Verificar Instalación

```bash
node --version     # v18.x.x o superior
python --version   # Python 3.10+
psql --version     # psql (PostgreSQL) 12+
git --version      # git version 2.x+
```

---

## 📦 Instalación

### 1️⃣ Clonar el Repositorio

```bash
git clone https://github.com/sawiedwin08/CMSS-Biomedicoos.git
cd CMSS-Biomedicoos
```

### 2️⃣ Configurar Base de Datos PostgreSQL

#### En Windows (CMD o PowerShell):
```bash
# Acceder a PostgreSQL
psql -U postgres

# Dentro de psql, crear la BD
CREATE DATABASE cmss_biomedico;
CREATE USER cmss WITH PASSWORD 'changeme';
ALTER ROLE cmss SET client_encoding TO 'utf8';
ALTER ROLE cmss SET default_transaction_isolation TO 'read committed';
ALTER ROLE cmss SET default_transaction_deferrable TO on;
ALTER ROLE cmss SET default_tzinfo TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE cmss_biomedico TO cmss;
\q
```

#### En macOS/Linux:
```bash
sudo -u postgres psql

# Dentro de psql (igual que arriba)
CREATE DATABASE cmss_biomedico;
CREATE USER cmss WITH PASSWORD 'changeme';
ALTER ROLE cmss SET client_encoding TO 'utf8';
ALTER ROLE cmss SET default_transaction_isolation TO 'read committed';
ALTER ROLE cmss SET default_transaction_deferrable TO on;
ALTER ROLE cmss SET default_tzinfo TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE cmss_biomedico TO cmss;
\q
```

### 3️⃣ Configurar Backend (Python)

```bash
# Entrar a la carpeta del backend
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Windows:
venv\Scripts\activate
# En macOS/Linux:
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Crear archivo .env (copiar del .env.example si existe)
# O crear uno manualmente con:
cp .env.example .env  # macOS/Linux
copy .env.example .env  # Windows

# Ejecutar migraciones
alembic upgrade head

# Seed de datos iniciales (opcional)
python -m app.infrastructure.db.seed
```

### 4️⃣ Configurar Frontend (React)

```bash
# Volver a la raíz del proyecto
cd ../frontend

# Instalar dependencias
npm install

# O con yarn
yarn install
```

---

## ⚙️ Configuración

### Backend - Archivo `.env`

Crear archivo `backend/.env` con:

```bash
# Aplicación
APP_NAME=CMSS-Biomedico
APP_ENV=development
DEBUG=true

# Base de Datos
DATABASE_URL=postgresql+psycopg://cmss:changeme@localhost:5432/cmss_biomedico

# Seguridad / JWT
SECRET_KEY=tu-clave-secreta-aqui-cambiar-en-produccion
ACCESS_TOKEN_EXPIRE_MINUTES=60
ALGORITHM=HS256

# CORS
BACKEND_CORS_ORIGINS=http://localhost:5173,http://localhost:5174

# Almacenamiento
STORAGE_DIR=./uploads
```

### Frontend - Configuración

El frontend usa Vite y está pre-configurado. Verificar en `frontend/vite.config.ts`:

```typescript
// revisar si puerto esta ocuapdo Backend debe correr en http://localhost:8000
```

---

## 🚀 Ejecutar el Proyecto

### Terminal 1️⃣ - Backend

```bash
cd backend

# Activar entorno virtual (si no está activo)
source venv/bin/activate  # macOS/Linux
# o
venv\Scripts\activate  # Windows

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend disponible en: **http://localhost:8000**

Documentación interactiva: **http://localhost:8000/docs**

### Terminal 2️⃣ - Frontend

```bash
cd frontend

# Ejecutar servidor de desarrollo
npm run dev
```

Frontend disponible en: **http://localhost:5173**

---

## 📁 Estructura del Proyecto

```
CMSS-Biomedicoos/
├── backend/
│   ├── app/
│   │   ├── core/                    # Configuración
│   │   ├── domain/                  # Lógica de negocio
│   │   │   ├── entities/            # Entidades del dominio
│   │   │   └── enums/               # Enumeraciones
│   │   ├── infrastructure/          # Base de datos, repos
│   │   │   ├── db/                  # Configuración BD
│   │   │   ├── models/              # Modelos SQLAlchemy
│   │   │   └── repositories/        # Repositorios
│   │   ├── presentation/            # APIs, schemas
│   │   │   ├── api/                 # Endpoints
│   │   │   └── schemas/             # Validaciones Pydantic
│   │   └── main.py                  # Punto de entrada
│   ├── alembic/                     # Migraciones de BD
│   ├── requirements.txt             # Dependencias Python
│   ├── .env                         # Variables de entorno
│   └── pyproject.toml               # Configuración Python
│
├── frontend/
│   ├── src/
│   │   ├── app/                     # App principal
│   │   ├── features/                # Módulos/características
│   │   │   ├── inventario/          # Módulo inventario
│   │   │   ├── mantenimiento/       # Módulo mantenimiento
│   │   │   └── tardanzas/           # Módulo tardanzas
│   │   ├── shared/                  # Componentes compartidos
│   │   └── index.css                # Estilos globales
│   ├── public/                      # Archivos estáticos
│   ├── package.json                 # Dependencias Node
│   ├── vite.config.ts               # Config Vite
│   └── tsconfig.json                # Config TypeScript
│
├── README.md                        # Este archivo
└── .gitignore                       # Archivos ignorados
```

---

## 🛠️ Comandos Útiles

### Backend

```bash
# Crear nueva migración
cd backend
alembic revision --autogenerate -m "Descripción del cambio"

# Ejecutar migraciones
alembic upgrade head

# Revertir última migración
alembic downgrade -1

# Ver historial de migraciones
alembic history

# Testear (si existen tests)
pytest

# Linter y formateo
black .
flake8
```

### Frontend

```bash
# Instalar nueva dependencia
npm install nombre-paquete

# Actualizar dependencias
npm update

# Build para producción
npm run build

# Preview de build
npm run preview

# Linter
npm run lint

# Formateo
npm run format
```

### Git

```bash
# Ver ramas disponibles
git branch -a

# Cambiar a rama develop (recomendado para desarrollo)
git checkout develop

# Crear nueva rama de feature
git checkout -b feature/nombre-feature

# Ver estado
git status

# Commits recientes
git log --oneline -10
```

---

## 🔐 Credenciales Iniciales

Después de ejecutar el seed de datos:

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Admin |
| coordinador | coord123 | Coordinador |

⚠️ **Cambiar estas contraseñas en producción**

---

## 🆘 Solución de Problemas

### Error: "connection refused" a PostgreSQL

```bash
# Verificar si PostgreSQL está corriendo
# Windows:
net start postgresql-x64-xx

# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql
```

### Error: "Port 8000 already in use"

```bash
# Cambiar puerto en backend
uvicorn app.main:app --reload --port 8001
```

### Error: "Module not found" en Python

```bash
# Verificar que el entorno virtual esté activado
# y reinstalar dependencias
pip install -r requirements.txt
```

### Error: "npm ERR! code ERESOLVE"

```bash
# Instalar con legacy peer deps
npm install --legacy-peer-deps
```

---

## 📚 Recursos Adicionales

- **FastAPI Docs:** http://localhost:8000/docs
- **PostgreSQL:** [postgresql.org](https://www.postgresql.org/)
- **React:** [react.dev](https://react.dev/)
- **Vite:** [vitejs.dev](https://vitejs.dev/)

---

## 👥 Contribuciones

1. Crear rama: `git checkout -b feature/mi-feature`
2. Hacer cambios y commit
3. Push: `git push origin feature/mi-feature`
4. Abrir Pull Request a `develop`

---

## 📄 Licencia

Proyecto privado - CMSS-Biomedical © 2026
