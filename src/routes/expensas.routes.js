const { Router } = require('express');
const ctrl = require('../controllers/expensas.controller');

const router = Router();

router.get('/', ctrl.listar);            // GET /api/expensas?estado=PENDIENTE&unidadId=1&anio=2026&mes=9
router.get('/resumen', ctrl.resumen);    // GET /api/expensas/resumen
router.get('/:id', ctrl.obtenerPorId);   // GET /api/expensas/3

module.exports = router;
