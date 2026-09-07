# NEXA · Backend Financiero (Dev Backend 1)

Módulo financiero del Sistema de Administración del Edificio XYZ.
Stack: Node.js · Express · Prisma ORM · PostgreSQL.

## Arranque rápido
```bash
npm install
cp .env.example .env
docker compose up -d                  # PostgreSQL en Docker (o usa Postgres.app y ajusta .env)
npx prisma migrate dev --name init    # crea las tablas
npm run db:seed                       # datos de prueba
npm test                              # 20 pruebas unitarias (no requieren BD)
npm run dev                           # http://localhost:3000
```

## Endpoints disponibles
| Método | Ruta | Descripción |
|---|---|---|
| GET | /health | Estado del servicio y conexión a BD |
| GET | /api/expensas | Lista expensas (filtros: estado, unidadId, anio, mes) |
| GET | /api/expensas/resumen | Totales por estado |
| GET | /api/expensas/:id | Detalle con pagos aplicados |
| GET | /api/cuentas | Cuentas de caja y bancos con saldos |
| GET | /api/cuentas/:id/movimientos | Libro de movimientos de una cuenta |

## Estructura
```
prisma/
  schema.prisma     ← modelo de datos (24 tablas)
  seed.js           ← datos de prueba
src/
  server.js         ← arranque
  app.js            ← configuración Express
  config/prisma.js  ← cliente Prisma (singleton)
  routes/           ← definición de rutas
  controllers/      ← manejo HTTP
  services/         ← lógica de negocio + acceso a datos
  utils/            ← funciones puras (cálculo de mora, estados de expensa)
  middlewares/      ← errores y 404
tests/              ← pruebas unitarias (node:test)
docs/               ← colección Postman
```

Ver `GUIA_EXPO_7SEP.md` (paso a paso y defensa técnica) y `CHECKLIST_ENTREGA_DOMINGO.md` (evidencias a subir).
