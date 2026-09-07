const { Router } = require('express');
const healthRoutes = require('./health.routes');
const expensasRoutes = require('./expensas.routes');
const cuentasRoutes = require('./cuentas.routes');

const router = Router();

router.use('/health', healthRoutes);
router.use('/api/expensas', expensasRoutes);
router.use('/api/cuentas', cuentasRoutes);

module.exports = router;
