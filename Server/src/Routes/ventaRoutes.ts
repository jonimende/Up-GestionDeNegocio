// src/Routes/ventasRoutes.ts
import { Router } from 'express';
import { ventasController } from '../Controllers/ventaController';

const router = Router();

// Obtener todas las ventas (incluyendo celulares, accesorios y reparaciones)
router.get('/', async (req, res, next) => {
  await ventasController.getVentas(req, res, next);
});

router.post('/', async (req, res, next) => {
  await ventasController.createVenta(req, res, next);
});

export default router;
