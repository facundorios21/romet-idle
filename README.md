# Aetheria - Collection Card Game (Idle Gacha)

Un videojuego de cartas coleccionables con mecánicas idle gacha, construido con una arquitectura limpia (Clean Architecture), SOLID y un diseño minimalista/cuadrático en Next.js (Frontend) y NestJS (Backend) con base de datos PostgreSQL.

## Requisitos Previos

Asegúrate de tener instalados los siguientes componentes en tu sistema:
- **Node.js** (v18 o superior recomendado)
- **pnpm** (Gestor de paquetes utilizado en todo el monorepo)
- **Docker y Docker Compose** (Para levantar la base de datos PostgreSQL)

---

## Estructura del Proyecto

El proyecto está dividido en dos partes principales:
- `backend/`: API REST construida con **NestJS** y **Prisma ORM** (conectada a PostgreSQL).
- `frontend/`: Aplicación web construida con **Next.js** y estilos CSS Modules minimalistas.

---

## Instrucciones para Iniciar el Proyecto

Sigue estos pasos en orden para levantar la aplicación completa:

### 1. Variables de Entorno (`.env`)
En el directorio raíz del proyecto y en el directorio `backend/` hay un archivo `.env.example`.
Crea copias de estos archivos nombrándolas `.env`:
```bash
# Copia el .env en la raíz del proyecto
cp .env.example .env

# Copia el .env en el backend
cp .env.example backend/.env
```
*(Nota: La configuración por defecto está lista para funcionar de inmediato conectándose al puerto `5432` local).*

### 2. Levantar la Base de Datos (Docker)
En la raíz del proyecto, ejecuta el comando para iniciar el contenedor de PostgreSQL:
```bash
docker compose up -d
```
Esto creará y ejecutará en segundo plano el contenedor `romet-idle-postgres` en el puerto `5432`.

### 3. Configuración y Sembrado del Backend
Entra en la carpeta `backend/`, instala las dependencias, crea las tablas de la base de datos y ejecuta el script de sembrado (seed):
```bash
cd backend
pnpm install
pnpm run db:setup
```
Este comando realizará las siguientes tareas:
1. Instalar dependencias de NestJS y Prisma.
2. Ejecutar las migraciones pendientes en PostgreSQL.
3. Sembrar datos iniciales:
   - Configuración de sobres dinámicos (`basic`, `standard`, `legendary`).
   - Las 7 cartas iniciales asociadas a los **sprites pixel art** (`/cards/air.png`, etc.).
   - Crea un usuario **Administrador** predeterminado:
     - **Email:** `admin@aetheria.com`
     - **Contraseña:** `admin123`

### 4. Iniciar el Servidor de Desarrollo Backend
Con la base de datos configurada y sembrada, arranca el servidor backend de NestJS:
```bash
pnpm run start:dev
```
El backend estará disponible en: **`http://localhost:3000/api`**

### 5. Iniciar la Aplicación Frontend (Next.js)
Abre otra terminal en el directorio del proyecto, entra a la carpeta `frontend/`, instala las dependencias e inicia el servidor de desarrollo:
```bash
cd frontend
pnpm install
pnpm run dev
```
La aplicación web estará disponible en: **`http://localhost:3001`**

---

## Funcionalidades del Proyecto

- **Generador Idle de Monedas**: Ticking fluido en el cliente que acumula esencias de forma pasiva y sincroniza clicks y ganancias periódicamente con la base de datos.
- **Tienda Gacha Dinámica**: Compra sobres de cartas (Básico, Estándar, Legendario) con probabilidades de rareza (Común, Raro, Épico, Legendario, Mítico) y efecto de revelado visual al pasar el mouse ("hover").
- **Álbum de Colección**: Visualiza tus cartas en 3D con efecto de paralaje interactivo. Permite filtros por rareza, elemento, posesión e inspeccionar cartas individualmente en un modal de detalles.
- **Panel de Administrador**: Ruta segura (`/admin`) con rol verificado (`ADMIN`) para:
  - Crear nuevas cartas cargando tus propias imágenes (guardadas en el servidor).
  - Configurar precios, cantidad de cartas y probabilidades gacha de cada sobre.
