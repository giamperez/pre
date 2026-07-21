# Vertex Comercial Monorepo

Este es el repositorio central (monorepo) para las herramientas comerciales de Vertex, construido con NPM Workspaces.

## Estructura del Proyecto

El monorepo contiene las siguientes aplicaciones y paquetes:

- **`apps/api`**: Backend construido en NestJS con TypeScript y Prisma (PostgreSQL). Provee la API REST para el catálogo y captura de leads.
- **`apps/precotizador`**: Frontend en React + Vite + TailwindCSS. Es una herramienta pública donde los clientes pueden visualizar el catálogo de una empresa y pre-cotizar servicios.
- **`apps/cotizador`**: Frontend en React + Vite + TailwindCSS. Es la herramienta interna (futura) donde los comerciales gestionarán y crearán cotizaciones formales complejas (PDF, múltiples módulos, etc.).
- **`packages/shared`**: Paquete interno con TypeScript que contiene los tipos e interfaces compartidos entre el backend y los frontends.

## Requisitos Previos

- Node.js (v18 o superior)
- NPM (v9 o superior)
- PostgreSQL (si vas a ejecutar la base de datos localmente para `apps/api`)

## Instalación y Configuración

1. **Instalar dependencias globales**
   Ejecuta el siguiente comando en la **raíz del proyecto** para instalar las dependencias de todos los workspaces:
   ```bash
   npm install
   ```

2. **Configurar el Backend (`apps/api`)**
   Copia el archivo de variables de entorno de ejemplo:
   ```bash
   cd apps/api
   cp .env.example .env
   ```
   Edita el archivo `.env` y asegúrate de configurar tu `DATABASE_URL` correcta.
   Si tienes tu base de datos lista, inicializa Prisma:
   ```bash
   npx prisma db push
   npx prisma generate
   ```

## Ejecución Local

Puedes levantar cada aplicación de manera individual usando el flag `-w` (workspace) de npm desde la raíz del proyecto.

### Levantar la API
```bash
npm run start:dev -w apps/api
```
La API estará disponible en `http://localhost:3000`.

### Levantar el Precotizador
```bash
npm run dev -w apps/precotizador
```
El precotizador estará disponible en el puerto que asigne Vite (usualmente `http://localhost:5173`).
Ruta de prueba: `http://localhost:5173/catalog/demo`

### Levantar el Cotizador
```bash
npm run dev -w apps/cotizador
```
El cotizador estará disponible en un puerto diferente asignado por Vite (usualmente `http://localhost:5174`).

## Próximos Pasos (Siguientes iteraciones)
- Implementar autenticación real en `apps/cotizador`.
- Implementar generador de PDF.
- Implementar bot de WhatsApp y flujos automatizados con n8n.
