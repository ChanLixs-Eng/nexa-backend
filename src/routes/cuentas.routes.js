const { Router } = require('express');
const ctrl = require('../controllers/cuentas.controller');

const router = Router();

router.get('/', ctrl.listar);                     // GET /api/cuentas
router.get('/:id/movimientos', ctrl.movimientos); // GET /api/cuentas/1/movimientos

module.exports = router;
