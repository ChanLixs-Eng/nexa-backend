// Capa de controlador: recibe HTTP, valida entrada básica y delega al servicio
const service = require('../services/expensas.service');

async function listar(req, res, next) {
  try {
    const data = await service.listar(req.query);
    res.json({ ok: true, total: data.length, data });
  } catch (err) {
    next(err);
  }
}

async function resumen(req, res, next) {
  try {
    const data = await service.resumen();
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ ok: false, error: 'El id debe ser un entero positivo' });
    }
    const data = await service.obtenerPorId(id);
    if (!data) return res.status(404).json({ ok: false, error: 'Expensa no encontrada' });
    res.json({ ok: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { listar, resumen, obtenerPorId };
