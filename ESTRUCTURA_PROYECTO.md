# Estructura del Proyecto: Aetheria (Mystic Idle Card Game)

Este documento detalla la arquitectura, el diseño de la base de datos, el flujo de componentes y los aspectos de seguridad implementados tanto en el frontend como en el backend del proyecto **Aetheria**.

---

## 📂 Arquitectura General y Carpetas

El proyecto está dividido en un monorrepo que separa claramente la lógica del servidor (Backend) y del cliente (Frontend):

```
romet-idle/
├── backend/               # Servidor NestJS (Clean Architecture / Hexagonal)
│   ├── src/
│   │   ├── core/          # Dominio puro (Entidades de Negocio e Interfaces)
│   │   ├── use-cases/     # Casos de uso (Lógica de aplicación: Auth, Admin, Packs, Colecciones)
│   │   ├── infrastructure/# Repositorios de datos, configuración de base de datos y controladores
│   │   └── main.ts        # Punto de entrada de la aplicación
│   └── package.json
│
├── frontend/              # Aplicación Web Next.js (App Router y React Context)
│   ├── src/
│   │   ├── app/           # Vistas principales (dashboard, login, register, upgrader, admin, etc.)
│   │   ├── components/    # Componentes reutilizables (Card3D, Navbar)
│   │   ├── context/       # Estado global (UserContext, GameConfig)
│   │   └── lib/           # Clientes de API, efectos de sonido y utilidades
│   └── package.json
│
└── ESTRUCTURA_PROYECTO.md  # Este archivo
```

---

## 🛠️ Modificaciones de Base de Datos y UUIDs Generativos

En cumplimiento con el nuevo diseño sin IDs textuales manuales ni autoincrementales numéricos para usuarios y transacciones, se migraron todas las llaves primarias y foráneas a **UUIDs generativos automáticos**.

### Entidades TypeORM del Backend
Todas las tablas del sistema ahora heredan identificadores únicos universales utilizando `@PrimaryGeneratedColumn('uuid')`:

1. **`UserEntity` (`users`)**:
   - Identificador primario migrado a UUID de tipo `string`.
   - Lógica de autenticación adaptada para tokens JWT usando el claim `sub` como UUID.
2. **`CardEntity` (`cards`)**:
   - Generación automática de UUID para cartas nuevas. El panel de administración descarta el ingreso manual de IDs.
3. **`UserCardEntity` (`user_cards`)**:
   - Llave primaria de registro transpuesta a UUID.
   - La columna `userId` se modificó a tipo `string` para coincidir con la llave primaria UUID del usuario en TypeORM.
4. **`PackEntity` (`packs`)**:
   - Genera automáticamente un UUID al crearse un sobre de cartas gacha.

---

## 🛡️ Capas de Seguridad y Validaciones Implementadas

Se han añadido múltiples mecanismos de validación y seguridad en ambos entornos para garantizar la estabilidad y protección frente a abusos comunes.

### 🔒 Backend (NestJS)

1. **Helmet HTTP Headers (`helmet`)**:
   - Middleware configurado para establecer cabeceras HTTP seguras contra ataques de inyección, clickjacking y sniffing de MIME-types.
   - Configurado con políticas de recursos de origen cruzado (`crossOriginResourcePolicy`) permisivas para servir correctamente las imágenes de las cartas.
2. **Tasa de Límite de Peticiones (`@nestjs/throttler`)**:
   - Previene ataques de denegación de servicio (DDoS) y ataques de fuerza bruta.
   - Configurado con un límite global de **120 peticiones por minuto**.
3. **Hardenización de CORS**:
   - Configuración segura de CORS. Permite restringir el acceso del servidor únicamente a orígenes autorizados a través de variables de entorno (`ALLOWED_ORIGINS`).
4. **Pipe de Validación Estricta (`ValidationPipe`)**:
   - Configurado con `whitelist: true` y `forbidNonWhitelisted: true`.
   - Bloquea cualquier petición que envíe datos extraños o maliciosos no definidos en los DTOs.
5. **Autenticación con JWT**:
   - Rutas administrativas protegidas mediante guardias de roles (`ADMIN`) y validación estricta de firma criptográfica en tokens.

### 🛡️ Frontend (Next.js)

1. **Validaciones en Formulario de Registro**:
   - Validación local de longitud mínima del Nombre de Usuario (mínimo 3 caracteres).
   - Comprobación estricta del formato de correo electrónico mediante expresiones regulares (`emailRegex`).
   - Requisito de complejidad de contraseña (mínimo 6 caracteres) con feedback inmediato en pantalla para el usuario antes de realizar llamadas al backend.
2. **Validaciones en Formulario de Login**:
   - Limpieza y sanitización de datos (eliminación de espacios al inicio/final del correo electrónico).
   - Comprobación de longitud y formato antes de enviar la petición de inicio de sesión.
3. **Administración libre de Diálogos Nativos (`alert()`, `confirm()`, `prompt()`)**:
   - Se eliminaron por completo las ventanas emergentes del navegador. Todas las acciones administrativas de creación, edición y eliminación de cartas, sobres, elementos y rarezas se ejecutan mediante formularios dedicados interactivos y modales de confirmación integrados en la interfaz de usuario.
4. **Selectores de Color Nativos (Color Pickers)**:
   - Se reemplazó el ingreso manual de códigos hexadecimales de colores para los elementos y rarezas del sistema por selectores visuales nativos `<input type="color" />` para máxima usabilidad.

---

## 🎨 Componentes Visuales Destacados: `Card3D`

La visualización de las cartas cuenta con un sistema interactivo tridimensional:
- **Efectos según prioridad (1 al 10)**: Las rarezas del juego se evalúan dinámicamente y el componente `Card3D` clasifica las cartas en cuatro niveles visuales (low, medium, high y max).
- **Animaciones y Brillos**: Las cartas con mayor prioridad muestran sutiles animaciones de brillos metalizados cruzados y un aura pulsante dorada en los bordes para denotar su exclusividad.

---

## 🚀 Comandos y Gestión del Proyecto

Es obligatorio el uso de **`pnpm`** como gestor exclusivo de paquetes en este proyecto.

### Backend
- **Instalación de dependencias**: `pnpm install`
- **Desarrollo**: `pnpm run start:dev`
- **Producción (Build)**: `pnpm run build`
- **Poblar Base de Datos (Semilla)**: `pnpm run db:setup`

### Frontend
- **Instalación de dependencias**: `pnpm install`
- **Desarrollo**: `pnpm run dev`
- **Producción (Build)**: `pnpm run build`

---

## 🗂️ Concepto de "Set" / Colecciones Místicas

En los juegos de cartas coleccionables (TCG/CCG), un **Set** o **Expansión** agrupa un conjunto de cartas asociadas a un lanzamiento, expansión temática o edición de cartas. 
En **Aetheria**, el catálogo inicial se ha estructurado en **3 Sets distintos** con **5 cartas cada uno (total de 15 cartas iniciales)**:

1. **Genesis**: El set fundacional centrado en las fuerzas clásicas del aire, la luz, el fuego y las sombras.
2. **Abyss**: Centrado en criaturas marinas legendarias y entidades tenebrosas nacidas del lecho oceánico profundo.
3. **Aether**: Centrado en energías cósmicas y espíritus celestes ancestrales.
