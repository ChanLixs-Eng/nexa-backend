# Checklist de entrega · domingo 6-sep antes de las 23:59

Según la guía del docente, si no hay commits y Pull Request en el repo antes de las 23:59 la semana cuenta como **no entregada (0/100)**. Esto es lo que se evalúa y lo que tienes que subir, en orden de prioridad.

## Qué se te exige como Dev Backend

| Evidencia obligatoria (matriz del docente) | Con qué la cubres | Puntos |
|---|---|---|
| Pull Request fusionado en la rama principal | Rama `feature/...` → PR → aprobado por un compañero → merge en `develop` | 30 (Git) |
| Documentación de la API (Swagger/Postman) | `docs/NEXA.postman_collection.json` (ya está en el proyecto) | 50 (entregable) |
| Pruebas unitarias base pass | `npm test` → 20 tests en verde | 50 (entregable) |
| Tareas en Done en el tablero | Jira / Trello / Azure: tus tarjetas de la semana en Done, ligadas a una HU | 30 (Git) |
| Capturas de pantalla de todo lo anterior | Subirlas a la plataforma de la clase (donde está publicada la guía) | — |

La URL pública de staging es evidencia del rol DevOps; si tu equipo aún no la tiene, no es tu responsabilidad esta semana, pero avísale al PM.

---

## PASO 1 · Preparar el código (15 min)

```bash
unzip nexa-backend.zip && cd nexa-backend
npm install            # genera package-lock.json (también va al repo)
npm test               # 20 tests deben pasar → CAPTURA 1
```

Si `npm install` tarda o falla, sigue con el Paso 2 igual: lo urgente es que el código llegue al repo. Arreglas el entorno después.

## PASO 2 · Subir al repositorio del equipo con GitFlow (20 min) ← LO MÁS URGENTE

**Averigua primero con tu PM/DevOps si ya existe el repo del equipo y cómo está organizado** (un solo repo con carpetas `backend/` y `frontend/`, o repos separados). Dos escenarios:

### Escenario A · Ya existe el repo del equipo
```bash
git clone <url-del-repo-del-equipo> nexa-repo
cd nexa-repo
git checkout develop                     # si no existe: git checkout -b develop && git push -u origin develop
git checkout -b feature/HU-XX-arquitectura-bd-financiero
# copia el contenido de nexa-backend/ a la carpeta backend/ (o la raíz, según acuerden)
```
Reemplaza `HU-XX` por el código real de tu Historia de Usuario en el tablero.

### Escenario B · Aún no hay repo (créalo tú y avísale al PM)
```bash
cd nexa-backend
git init -b main
git add README.md .gitignore .env.example
git commit -m "chore: inicializa repositorio NEXA backend"
git checkout -b develop
git checkout -b feature/HU-XX-arquitectura-bd-financiero
```

### Commits (en ambos escenarios) — mensajes descriptivos valen 30 puntos
Haz commits separados por tema, no uno solo con todo:
```bash
git add package.json package-lock.json docker-compose.yml
git commit -m "chore(backend): configura Node, Express, Prisma 6 y PostgreSQL en Docker"

git add prisma/schema.prisma
git commit -m "feat(financiero): modelo de datos Prisma con 24 tablas para expensas, pagos, caja/bancos y nómina (HU-XX)"

git add prisma/seed.js
git commit -m "feat(financiero): seed de datos con pagos, ingresos y egresos en transacciones atómicas"

git add src/
git commit -m "feat(api): arquitectura en capas y endpoints GET de expensas y cuentas"

git add tests/ 
git commit -m "test(expensas): 20 pruebas unitarias de cálculo de mora y estados de expensa"

git add docs/ .github/ GUIA_EXPO_7SEP.md CHECKLIST_ENTREGA_DOMINGO.md
git commit -m "docs: colección Postman, plantilla de PR y guía técnica del módulo"

git push -u origin develop            # solo en escenario B
git push -u origin feature/HU-XX-arquitectura-bd-financiero
```

### Pull Request
1. En GitHub: **Compare & pull request** → base `develop` ← compare `feature/HU-XX-...`.
2. Título: `feat(financiero): arquitectura de BD y entorno local — Semana 2 (HU-XX)`.
3. La plantilla del PR se llena sola (`.github/pull_request_template.md`); completa la HU y el checklist.
4. **Pide a un compañero (idealmente el otro backend o QA) que apruebe el PR ahora mismo** por WhatsApp. El Definition of Done exige Code Review. Si a las 23:30 nadie respondió, fusiona tú y deja un comentario: "Fusionado para cumplir el plazo; revisión de pares pendiente para el lunes".
5. **Merge pull request** → CAPTURA 2 (PR fusionado con aprobación) y CAPTURA 3 (historial de commits).

## PASO 3 · Tablero (10 min)

En el Jira/Trello/Azure del equipo (si no existe, el PM debe crearlo hoy):
- Historia de Usuario, por ejemplo: `HU-XX · Como administrador quiero que el sistema registre expensas, pagos y movimientos de caja para controlar las finanzas del edificio`.
- Tus tareas de la semana, en **Done**:
  - `Diseñar modelo de BD del módulo financiero`
  - `Configurar entorno local: Node + Express + Prisma + PostgreSQL`
  - `Endpoints base de expensas y cuentas`
  - `Pruebas unitarias de cálculo de mora`
- Pega la URL del PR en la tarea → CAPTURA 4 (tablero con tus tareas en Done).

## PASO 4 · Entorno corriendo y capturas técnicas (30 min)

Sigue `GUIA_EXPO_7SEP.md` sección 2 (Docker → migrate → seed → dev). Luego:
- CAPTURA 5: terminal con `✅ Conectado a PostgreSQL` y `🚀 NEXA Backend Financiero en http://localhost:3000`
- CAPTURA 6: Postman con `docs/NEXA.postman_collection.json` importada y `/api/expensas` respondiendo 200
- CAPTURA 7: Prisma Studio (`npx prisma studio`) mostrando las tablas
- CAPTURA 8: diagrama en dbdiagram.io (además del PNG exportado)

## PASO 5 · Subir a la plataforma de la clase (10 min)

Sube las 8 capturas donde el docente publicó la guía (la sección "Comentarios de la clase" sugiere Google Classroom), con un texto breve:

> Semana 2 · Dev Backend 1 (Financiero) · Entregable: Arquitectura BD y entorno local.
> PR: <url> · Repo: <url> · Tablero: <url>
> Evidencias: PR fusionado, historial de commits, tareas en Done, 20 tests unitarios pass, colección Postman, servidor + PostgreSQL corriendo, diagrama de BD (24 tablas).

## Si se te acaba el tiempo

Prioridad absoluta, en este orden: (1) commits y PR en el repo, (2) captura de `npm test`, (3) tablero en Done, (4) capturas subidas. El entorno con Docker y Prisma Studio puedes terminarlo mañana a las 6:00 antes de la expo de las 7:30; sin eso no pierdes la semana, sin el PR sí.
