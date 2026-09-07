# NEXA · Backend Financiero · Guía para la expo del lunes 7-sep

## 0. Qué tienes que mostrar mañana

Tu entregable del cronograma grupal para el 7-sep es **"Arquitectura BD y entorno local"**. En concreto:

1. **Diagrama de la base de datos** del módulo financiero (imagen exportada de dbdiagram.io).
2. **Backend corriendo en tu Mac**: Node + Express + Prisma conectado a PostgreSQL, con las 24 tablas creadas y datos de prueba.
3. **Pruebas unitarias base pasando** (`npm test`), documentación de API (colección Postman en `docs/`) y **Pull Request fusionado** en el repo del equipo.
4. **Tu plan de trabajo individual** (ya lo tienes; revisa que las semanas coincidan con el cronograma grupal).

**Antes de eso: el límite de subida de evidencias es HOY domingo 23:59.** Sigue primero `CHECKLIST_ENTREGA_DOMINGO.md` y vuelve a esta guía para preparar la defensa.

Tiempo estimado: 45–60 minutos si todo instala sin problemas.

---

## 1. Herramientas (10 min)

**Node.js** — en la terminal: `node -v`. Necesitas 18.18 o superior (ideal 20 o 22). Si no lo tienes: https://nodejs.org (LTS).

**PostgreSQL** — elige UNA opción:

- **Opción A · Docker (recomendada si ya tienes Docker Desktop).** El proyecto incluye `docker-compose.yml`. Solo asegúrate de que Docker Desktop esté abierto.
- **Opción B · Postgres.app.** Descarga https://postgresapp.com, ábrelo y pulsa "Initialize". En `.env` usa la línea de la Opción B (sin contraseña).

**Para probar endpoints** basta el navegador (Chrome) o Postman. En `docs/` hay una colección de Postman lista para importar.

---

## 2. Levantar el backend (20 min)

```bash
# 1. Descomprimir y entrar
unzip nexa-backend.zip
cd nexa-backend

# 2. Dependencias (Prisma 6 fijado a propósito: la v7 cambia la configuración)
npm install

# 3. Variables de entorno
cp .env.example .env
#    → si usas Postgres.app, edita .env y deja la línea de la Opción B

# 4. Base de datos (solo Opción A)
docker compose up -d
#    espera 10 segundos a que arranque

# 5. Crear las tablas a partir de schema.prisma
npx prisma migrate dev --name init
#    → crea la BD si no existe, aplica la migración y genera el cliente

# 6. Datos de prueba
npm run db:seed

# 7. Pruebas unitarias (no necesitan BD)
npm test

# 8. Arrancar
npm run dev
```

Deberías ver:
```
✅ Conectado a PostgreSQL
🚀 NEXA Backend Financiero en http://localhost:3000
```

**Probar en el navegador:**
- http://localhost:3000/health
- http://localhost:3000/api/expensas
- http://localhost:3000/api/expensas?estado=PENDIENTE
- http://localhost:3000/api/expensas/resumen
- http://localhost:3000/api/expensas/1
- http://localhost:3000/api/cuentas
- http://localhost:3000/api/cuentas/1/movimientos

**Vista gráfica de la BD (excelente para la demo):** en otra terminal, `npx prisma studio` → abre http://localhost:5555 y muestra todas las tablas con datos.

**Sube el repo esta noche:**
```bash
git init
git add .
git commit -m "feat: arquitectura BD y entorno local - módulo financiero"
# crea el repo en GitHub y:
git remote add origin <url>
git push -u origin main
```

---

## 3. Diagrama de BD (10 min)

1. Entra a https://dbdiagram.io → **New Diagram**.
2. Borra el código de ejemplo y pega TODO el contenido de `nexa_financiero.dbml`.
3. Arrastra las tablas si quieres ordenarlas por grupo (referencia · expensas · pagos · caja/bancos · ingresos/egresos · personal).
4. **Export → PNG**. Guárdalo como evidencia y súbelo al repo en `docs/diagrama-bd.png`.
5. **Deja la pestaña de dbdiagram.io abierta para la expo**: está prohibido usar diapositivas, así que el diagrama se muestra directamente en el navegador.

---

## 4. Cómo explicar el diseño (esto es lo que te evalúan)

El diagrama tiene 6 bloques. Aprende estas frases:

**Bloque de referencia** (usuario, copropietario, unidad, ocupacion): son tablas de los módulos de seguridad y copropietarios. Yo las incluyo porque mi módulo depende de ellas: las expensas se generan por unidad y todo registro financiero guarda qué usuario lo hizo (auditoría, requisito 10).

**Expensas** (configuracion_mora, periodo, expensa): la generación automática funciona así: cada mes se abre un `periodo` y el sistema crea una `expensa` por cada `unidad` activa. La mora es configurable mediante `configuracion_mora`, que tiene tasa mensual, días de gracia y vigencias, para que un cambio de tasa no altere cálculos históricos.

**Pagos** (pago, pago_detalle, anticipo): un `pago` puede cubrir varias expensas o solo parte de una, por eso existe `pago_detalle`. Si el copropietario paga de más, el excedente se guarda en `anticipo` y se aplica a expensas futuras (requisito de pagos anticipados).

**Caja y bancos** (cuenta, movimiento, conciliacion): `movimiento` es el libro mayor del sistema. Todo pago, ingreso, egreso o planilla genera exactamente un movimiento en una cuenta, con el saldo resultante. De esa única tabla salen el control de caja, el flujo de caja, el balance y la conciliación bancaria.

**Ingresos y egresos** (categoria, ingreso, egreso): ingresos extraordinarios y gastos clasificados por categoría, con URL del comprobante adjunto.

**Personal** (empleado, anticipo_empleado, planilla, planilla_detalle): liquidación mensual por empleado con bonos, descuentos y anticipos; al pagarla también genera un movimiento de egreso.

**Decisiones técnicas para mencionar:**
- Todos los montos son `DECIMAL(12,2)`. Un `FLOAT` no representa exactamente 0.10 y en contabilidad los centavos tienen que cuadrar.
- Los estados son ENUM en PostgreSQL (Prisma los genera): la BD misma rechaza un estado inválido.
- Índices en `expensa(estado)`, `expensa(fecha_vencimiento)`, `movimiento(cuenta_id, fecha)`: son las columnas por las que filtran los reportes (Riesgo 2 de mi matriz).
- Restricciones únicas de negocio: `(unidad, periodo)` para que no se genere dos veces la misma expensa; `(anio, mes)` en periodo; `(empleado, anio, mes)` en planilla.
- Arquitectura en capas: `routes → controllers → services → prisma`. El controlador solo maneja HTTP; la lógica vive en el servicio y es reutilizable.

**Mapeo requisitos del pliego → tablas** (por si te preguntan cobertura):

| Requisito del pliego | Tablas |
|---|---|
| 2. Gestión de expensas | periodo, expensa, configuracion_mora, pago, pago_detalle, anticipo |
| 3. Ingresos y egresos | categoria, ingreso, egreso |
| 4. Caja y bancos | cuenta, movimiento, conciliacion |
| 5. Reportes | consultas sobre expensa, movimiento, ingreso, egreso (semanas 12–13) |
| 6. Personal | empleado, anticipo_empleado, planilla, planilla_detalle |
| 10. Auditoría | usuario_id en todas las tablas transaccionales |
| Deseables: QR, recibos, exportación | pago.metodo = QR, pago.referencia, comprobante_url (semanas 14–15) |

---

## 5. Guion de defensa individual (2–3 minutos, SIN diapositivas)

La regla es estricta: todo se muestra sobre herramientas reales (VS Code, GitHub, Postman, navegador, Jira/Trello). Ten estas pestañas abiertas ANTES de que empiece la reunión, en este orden:

1. GitHub → tu Pull Request fusionado
2. VS Code → el proyecto con `schema.prisma` abierto
3. Terminal → servidor corriendo (`npm run dev`) y, en otra pestaña, `npm test` ya ejecutado con los 20 tests en verde
4. Navegador → dbdiagram.io con el diagrama
5. Postman → colección importada
6. Prisma Studio → http://localhost:5555 (opcional)

**[0:00–0:20] Rol y HU.** "Soy Dev Backend 1, módulo financiero. Esta semana mi tarea fue la arquitectura de la base de datos y el entorno local, asociada a la HU de gestión de expensas." (Di el código de la HU de tu tablero.)

**[0:20–0:40] Evidencia Git.** Muestra el PR fusionado: rama `feature/...` → `develop`, revisado por un compañero, con commits descriptivos.

**[0:40–1:40] Diagrama.** Pestaña de dbdiagram.io. Recorre los 6 bloques rápido y detente en tres cosas: `movimiento` como libro mayor, `pago_detalle` para pagos parciales y múltiples, y `configuracion_mora` con vigencias.

**[1:40–2:30] Funcionalidad en vivo.** Postman o navegador: `/health` → `/api/expensas` ("5 expensas de septiembre: una pagada, una parcial, tres pendientes") → `/api/cuentas/1/movimientos` ("el pago generó este movimiento y actualizó el saldo de caja"). Luego la terminal con `npm test`: "20 pruebas unitarias del cálculo de mora y estados de expensa, todas pasan".

**[2:30–3:00] Siguiente semana.** "Endpoints de soporte para login; por eso `usuario` ya está modelado."

No arranques nada en vivo. Si algo se cae, tienes las capturas subidas como respaldo.

---

## 6. Preguntas probables y respuestas

**¿Por qué PostgreSQL y no MySQL o MongoDB?**
Cumplimiento ACID estricto, tipo `NUMERIC/DECIMAL` exacto para dinero, transacciones con bloqueo de fila y muy buen soporte de consultas agregadas para reportes. Mongo no tiene transacciones multi-documento tan maduras ni joins nativos; para contabilidad, relacional es lo correcto.

**¿Por qué Prisma y no Sequelize o TypeORM?**
El esquema es declarativo y legible (`schema.prisma`), las migraciones se generan automáticamente y el cliente queda tipado, lo que evita errores en nombres de campos y tipos de montos. Además `prisma studio` sirve para inspeccionar datos.

**¿Cómo evitas que dos pagos simultáneos rompan un saldo?**
Toda operación que toca saldos va dentro de `prisma.$transaction`. En cobros críticos se bloquea la fila de la cuenta con `SELECT ... FOR UPDATE` (vía `$queryRaw`) o se usa nivel de aislamiento `Serializable`. Si algo falla, se revierte todo: no queda un pago sin movimiento ni un movimiento sin pago.

**¿Cómo calculas la mora?**
Con la `configuracion_mora` vigente en la fecha de vencimiento. Método simple: `mora = saldo_pendiente × (tasa_mensual / 100) × (dias_atraso / 30)`, donde `dias_atraso` cuenta desde `fecha_vencimiento + dias_gracia`. El resultado se acumula en `expensa.mora_acumulada`. El método compuesto capitaliza mes a mes. Se recalcula con un job diario o al consultar el estado de cuenta.

**¿Por qué guardas `saldo_actual` en cuenta si se puede calcular con los movimientos?**
Es una desnormalización controlada por rendimiento: el saldo se lee constantemente y sumar todos los movimientos históricos sería costoso (Riesgo 2). Se actualiza siempre dentro de la misma transacción que crea el movimiento, y `saldo_resultante` en cada movimiento permite auditar y reconstruir el saldo a cualquier fecha.

**¿Por qué `pago_detalle` y no un `expensa_id` directo en `pago`?**
Porque un copropietario puede pagar tres meses de una vez, o pagar la mitad de un mes. La tabla intermedia permite N expensas por pago y N pagos por expensa.

**¿Por qué Express y no NestJS?**
Simplicidad y curva de aprendizaje del equipo. La estructura en capas (routes/controllers/services) replica lo que aporta Nest sin la complejidad adicional. Si el proyecto crece, migrar es directo porque la lógica ya está aislada en servicios.

**¿Por qué JavaScript y no TypeScript si justificas type-safety?**
El arranque es en JS para tener el entorno estable el primer día. Prisma ya genera los tipos del cliente; la migración a TS está planificada para cuando se implementen los primeros endpoints con lógica de negocio.

**¿Cómo se relaciona tu módulo con el de copropietarios y el de seguridad?**
Consumo sus tablas por clave foránea (`unidad`, `copropietario`, `usuario`). Acordaremos con el otro backend quién es dueño de cada tabla en el esquema compartido; yo solo las leo.

**¿Qué pasa con el redondeo?**
Los cálculos puros (mora, estados) se hacen en centavos enteros (`src/utils/expensas.utils.js`), así 0.1 + 0.2 no da 0.30000000000000004; se redondea a 2 decimales una sola vez. Las operaciones sobre saldos en la BD usan `Prisma.Decimal` (decimal.js) y se persisten como `DECIMAL(12,2)`. Nunca se suma dinero con `Number` directo.

**¿Qué probaste con los tests unitarios?**
Las funciones puras del dominio: conversión a centavos, días de atraso con periodo de gracia, mora simple y compuesta (incluido redondeo), validaciones de entrada y la máquina de estados de la expensa (PENDIENTE → PARCIAL → PAGADA / VENCIDA). Son 20 casos con el runner nativo de Node (`node:test`), sin dependencias. Las pruebas de integración con la BD entran cuando existan los endpoints de escritura.

---

## 7. Si algo falla

| Síntoma | Solución |
|---|---|
| `P1001: Can't reach database server` | Docker Desktop no está corriendo o el contenedor no arrancó: `docker compose up -d` y espera 10 s. Con Postgres.app: verifica que el servidor esté "Running". |
| `port 5432 already in use` | Otro Postgres ocupa el puerto. En `docker-compose.yml` cambia a `"5433:5432"` y en `.env` usa `localhost:5433`. |
| `P1000: Authentication failed` | La contraseña de `.env` no coincide. Docker: `nexa123`. Postgres.app: sin contraseña (línea Opción B). |
| `migrate dev` pregunta si quiere resetear | Responde `y`; es tu BD local de desarrollo. |
| `EADDRINUSE :3000` | Cambia `PORT=3001` en `.env`. |
| `npm install` falla por versión de Node | Actualiza Node a 20 LTS desde nodejs.org. |
| El seed falla a mitad | Ejecuta `npm run db:reset` (borra y recrea todo) y luego `npm run dev`. |

Si el error es otro, copia el mensaje completo de la terminal y pégalo en el chat.
