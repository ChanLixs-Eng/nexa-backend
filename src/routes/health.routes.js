const { Router } = require('express');
const prisma = require('../config/prisma');

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      ok: true,
      servicio: 'NEXA Backend Financiero',
      version: '0.1.0',
      db: 'PostgreSQL conectada',
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
