require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 3000;

async function main() {
  await prisma.$connect();
  console.log('✅ Conectado a PostgreSQL');
  app.listen(PORT, () => {
    console.log(`🚀 NEXA Backend Financiero en http://localhost:${PORT}`);
    console.log('   GET /health · GET /api/expensas · GET /api/expensas/resumen · GET /api/cuentas');
  });
}

main().catch((err) => {
  console.error('❌ Error al iniciar:', err.message);
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});
