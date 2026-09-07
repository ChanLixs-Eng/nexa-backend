## Historia de Usuario
<!-- Ej: HU-05 · Como administrador quiero que el sistema genere expensas mensuales automáticamente -->
HU-__ ·

## Semana / Entregable
Semana __ · 

## ¿Qué incluye este PR?
- 
- 

## ¿Cómo probarlo?
```bash
npm install && cp .env.example .env
docker compose up -d && npx prisma migrate dev
npm run db:seed && npm test && npm run dev
```

## Checklist (Definition of Done)
- [ ] El código compila y el servidor arranca sin errores
- [ ] `npm test` pasa
- [ ] Documentación de API actualizada (Postman en `docs/`)
- [ ] Revisado por un compañero (Code Review)
- [ ] Tarea movida a **Done** en el tablero
