// src/Routes/ventasRoutes.ts
import { Router } from 'express';
import { ventasController } from '../Controllers/ventaController';
import { authenticateToken } from "../Middlewares/authMiddlewares";
import { isAdmin } from "../Middlewares/isAdmin"

const router = Router();

// Obtener todas las ventas (incluyendo celulares, accesorios y reparaciones)
router.get('/', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.getVentas(req, res, next);
});

router.post('/',authenticateToken, async (req, res, next) => {
  await ventasController.createVenta(req, res, next);
});

router.post('/admin', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.createVenta(req, res, next);
});
export default router;
