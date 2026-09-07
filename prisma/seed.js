// =====================================================================
//  Seed de datos de prueba · NEXA Módulo Financiero
//  Ejecutar: npm run db:seed   (se puede correr varias veces, limpia antes)
// =====================================================================
require('dotenv').config();
const { PrismaClient, Prisma } = require('@prisma/client');

const prisma = new PrismaClient();
const D = (v) => new Prisma.Decimal(v); // Decimal exacto, nunca float

// ---------------------------------------------------------------------
// Helper: registra un movimiento en una cuenta y actualiza su saldo.
// Se usa dentro de una transacción (tx) para garantizar atomicidad.
// ---------------------------------------------------------------------
async function registrarMovimiento(tx, { cuentaId, tipo, monto, origenTipo, descripcion, usuarioId }) {
  const cuenta = await tx.cuenta.findUniqueOrThrow({ where: { id: cuentaId } });
  const saldoResultante =
    tipo === 'INGRESO' ? cuenta.saldoActual.plus(monto) : cuenta.saldoActual.minus(monto);

  const movimiento = await tx.movimiento.create({
    data: { cuentaId, tipo, monto, saldoResultante, origenTipo, descripcion, usuarioId },
  });
  await tx.cuenta.update({ where: { id: cuentaId }, data: { saldoActual: saldoResultante } });
  return movimiento;
}

// ---------------------------------------------------------------------
// Helper: registra el pago de una expensa (flujo completo y atómico).
// Este es el mismo flujo que implementará el servicio de pagos (semana 6).
// ---------------------------------------------------------------------
async function registrarPagoExpensa({ expensaId, copropietarioId, cuentaId, monto, metodo, referencia, usuarioId }) {
  return prisma.$transaction(async (tx) => {
    const expensa = await tx.expensa.findUniqueOrThrow({ where: { id: expensaId }, include: { unidad: true } });

    const movimiento = await registrarMovimiento(tx, {
      cuentaId,
      tipo: 'INGRESO',
      monto,
      origenTipo: 'PAGO',
      descripcion: `Pago expensa ${expensa.unidad.codigo}`,
      usuarioId,
    });

    const pago = await tx.pago.create({
      data: {
        unidadId: expensa.unidadId,
        copropietarioId,
        cuentaId,
        movimientoId: movimiento.id,
        monto,
        metodo,
        referencia,
        usuarioId,
        detalles: { create: [{ expensaId: expensa.id, montoAplicado: monto, aplicadoA: 'CAPITAL' }] },
      },
    });

    const nuevoSaldo = expensa.saldoPendiente.minus(monto);
    await tx.expensa.update({
      where: { id: expensa.id },
      data: { saldoPendiente: nuevoSaldo, estado: nuevoSaldo.isZero() ? 'PAGADA' : 'PARCIAL' },
    });

    return pago;
  });
}

async function limpiar() {
  // Orden inverso a las dependencias (hijos primero)
  await prisma.pagoDetalle.deleteMany();
  await prisma.anticipo.deleteMany();
  await prisma.pago.deleteMany();
  await prisma.planillaDetalle.deleteMany();
  await prisma.anticipoEmpleado.deleteMany();
  await prisma.planilla.deleteMany();
  await prisma.ingreso.deleteMany();
  await prisma.egreso.deleteMany();
  await prisma.movimiento.deleteMany();
  await prisma.conciliacion.deleteMany();
  await prisma.expensa.deleteMany();
  await prisma.periodo.deleteMany();
  await prisma.configuracionMora.deleteMany();
  await prisma.ocupacion.deleteMany();
  await prisma.unidad.deleteMany();
  await prisma.copropietario.deleteMany();
  await prisma.categoria.deleteMany();
  await prisma.cuenta.deleteMany();
  await prisma.empleado.deleteMany();
  await prisma.usuario.deleteMany();
}

async function main() {
  console.log('🧹 Limpiando tablas...');
  await limpiar();

  // ---------- Usuario (módulo seguridad) ----------
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador NEXA',
      email: 'admin@nexa.bo',
      passwordHash: 'PENDIENTE_MODULO_SEGURIDAD',
      rol: 'ADMINISTRADOR',
    },
  });

  // ---------- Cuentas: caja y banco ----------
  const caja = await prisma.cuenta.create({
    data: { nombre: 'Caja General', tipo: 'CAJA', saldoInicial: D('1500.00'), saldoActual: D('1500.00') },
  });
  const banco = await prisma.cuenta.create({
    data: {
      nombre: 'Banco Unión - Cta. Cte.',
      tipo: 'BANCO',
      banco: 'Banco Unión',
      nroCuenta: '1000-2345-6789',
      saldoInicial: D('25000.00'),
      saldoActual: D('25000.00'),
    },
  });

  // ---------- Categorías ----------
  await prisma.categoria.createMany({
    data: [
      { nombre: 'Alquiler de salón de eventos', tipo: 'INGRESO' },
      { nombre: 'Multas', tipo: 'INGRESO' },
      { nombre: 'Otros ingresos', tipo: 'INGRESO' },
      { nombre: 'Servicios básicos (luz, agua)', tipo: 'EGRESO' },
      { nombre: 'Mantenimiento', tipo: 'EGRESO' },
      { nombre: 'Limpieza', tipo: 'EGRESO' },
      { nombre: 'Sueldos y salarios', tipo: 'EGRESO' },
    ],
  });
  const catAlquiler = await prisma.categoria.findFirst({ where: { nombre: 'Alquiler de salón de eventos' } });
  const catServicios = await prisma.categoria.findFirst({ where: { nombre: 'Servicios básicos (luz, agua)' } });

  // ---------- Unidades ----------
  const [dep101, dep201, dep301, parq01, baul01] = await Promise.all(
    [
      { codigo: 'DEP-101', tipo: 'DEPARTAMENTO', piso: 1, superficieM2: D('85.50'), coeficiente: D('0.0420') },
      { codigo: 'DEP-201', tipo: 'DEPARTAMENTO', piso: 2, superficieM2: D('92.00'), coeficiente: D('0.0455') },
      { codigo: 'DEP-301', tipo: 'DEPARTAMENTO', piso: 3, superficieM2: D('110.00'), coeficiente: D('0.0540') },
      { codigo: 'PARQ-01', tipo: 'PARQUEO', piso: -1, superficieM2: D('12.50'), coeficiente: D('0.0060') },
      { codigo: 'BAUL-01', tipo: 'BAULERA', piso: -1, superficieM2: D('4.00'), coeficiente: D('0.0020') },
    ].map((u) => prisma.unidad.create({ data: u }))
  );

  // ---------- Copropietarios y ocupaciones ----------
  const maria = await prisma.copropietario.create({
    data: { nombres: 'María', apellidos: 'Fernández Quiroga', ci: '4567890 CB', telefono: '70712345', email: 'maria@mail.com', tipo: 'PROPIETARIO' },
  });
  const carlos = await prisma.copropietario.create({
    data: { nombres: 'Carlos', apellidos: 'Rojas Mendoza', ci: '5678901 CB', telefono: '71823456', email: 'carlos@mail.com', tipo: 'PROPIETARIO' },
  });
  const lucia = await prisma.copropietario.create({
    data: { nombres: 'Lucía', apellidos: 'Vargas Soto', ci: '6789012 CB', telefono: '72934567', email: 'lucia@mail.com', tipo: 'INQUILINO' },
  });

  await prisma.ocupacion.createMany({
    data: [
      { unidadId: dep101.id, copropietarioId: maria.id, fechaInicio: new Date('2024-03-01') },
      { unidadId: parq01.id, copropietarioId: maria.id, fechaInicio: new Date('2024-03-01') },
      { unidadId: dep201.id, copropietarioId: carlos.id, fechaInicio: new Date('2023-01-15') },
      { unidadId: dep301.id, copropietarioId: lucia.id, fechaInicio: new Date('2026-06-01') },
    ],
  });

  // ---------- Configuración de mora ----------
  await prisma.configuracionMora.create({
    data: { tasaMensual: D('2.00'), diasGracia: 5, diaVencimiento: 10, metodo: 'SIMPLE', vigenteDesde: new Date('2026-01-01'), creadoPorId: admin.id },
  });

  // ---------- Periodo septiembre 2026 + expensas ----------
  const periodo = await prisma.periodo.create({
    data: { anio: 2026, mes: 9, montoBase: D('350.00'), fechaEmision: new Date('2026-09-01'), fechaVencimiento: new Date('2026-09-10') },
  });

  const montoPorTipo = { DEPARTAMENTO: D('350.00'), PARQUEO: D('50.00'), BAULERA: D('20.00') };
  const expensas = {};
  for (const u of [dep101, dep201, dep301, parq01, baul01]) {
    const monto = montoPorTipo[u.tipo];
    expensas[u.codigo] = await prisma.expensa.create({
      data: { unidadId: u.id, periodoId: periodo.id, monto, saldoPendiente: monto, fechaVencimiento: periodo.fechaVencimiento },
    });
  }

  // ---------- Pagos de demostración (transacciones atómicas) ----------
  await registrarPagoExpensa({
    expensaId: expensas['DEP-101'].id, copropietarioId: maria.id, cuentaId: caja.id,
    monto: D('350.00'), metodo: 'EFECTIVO', referencia: 'REC-0001', usuarioId: admin.id,
  }); // → PAGADA

  await registrarPagoExpensa({
    expensaId: expensas['DEP-201'].id, copropietarioId: carlos.id, cuentaId: banco.id,
    monto: D('200.00'), metodo: 'TRANSFERENCIA', referencia: 'TRX-88912', usuarioId: admin.id,
  }); // → PARCIAL (quedan 150 pendientes)

  // ---------- Ingreso extraordinario y egreso ----------
  await prisma.$transaction(async (tx) => {
    const mov = await registrarMovimiento(tx, {
      cuentaId: banco.id, tipo: 'INGRESO', monto: D('800.00'), origenTipo: 'INGRESO',
      descripcion: 'Alquiler salón de eventos - Sra. Pérez', usuarioId: admin.id,
    });
    await tx.ingreso.create({
      data: { categoriaId: catAlquiler.id, cuentaId: banco.id, movimientoId: mov.id, fecha: new Date('2026-09-03'), monto: D('800.00'), descripcion: 'Alquiler salón de eventos - Sra. Pérez', usuarioId: admin.id },
    });
  });

  await prisma.$transaction(async (tx) => {
    const mov = await registrarMovimiento(tx, {
      cuentaId: caja.id, tipo: 'EGRESO', monto: D('420.50'), origenTipo: 'EGRESO',
      descripcion: 'Factura ELFEC agosto 2026', usuarioId: admin.id,
    });
    await tx.egreso.create({
      data: { categoriaId: catServicios.id, cuentaId: caja.id, movimientoId: mov.id, fecha: new Date('2026-09-04'), monto: D('420.50'), proveedor: 'ELFEC', nroFactura: '00123456', descripcion: 'Factura ELFEC agosto 2026', usuarioId: admin.id },
    });
  });

  // ---------- Empleado ----------
  await prisma.empleado.create({
    data: { nombres: 'Juan', apellidos: 'Mamani Choque', ci: '3456789 CB', cargo: 'Portero', salarioBase: D('2500.00'), fechaIngreso: new Date('2022-05-01') },
  });

  // ---------- Resumen ----------
  const cuentas = await prisma.cuenta.findMany({ orderBy: { id: 'asc' } });
  console.log('\n✅ Seed completado');
  console.log('   Usuarios: 1 | Unidades: 5 | Copropietarios: 3 | Expensas 09/2026: 5');
  console.log('   Pagos: 2 (1 total, 1 parcial) | Ingresos: 1 | Egresos: 1 | Movimientos: 4');
  for (const c of cuentas) console.log(`   ${c.nombre}: Bs ${c.saldoActual.toFixed(2)}`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
