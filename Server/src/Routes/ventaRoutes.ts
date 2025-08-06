// src/Routes/ventasRoutes.ts
import { Router } from 'express';
import { ventasController } from '../Controllers/ventaController';
import { cajaController } from '../Controllers/cajaController';
import { authenticateToken } from "../Middlewares/authMiddlewares";
import { isAdmin } from "../Middlewares/isAdmin";

const router = Router();

// Obtener todas las ventas (incluyendo celulares, accesorios y reparaciones)
router.get('/', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.getVentas(req, res, next);
});

// Rutas fijas primero para que no choquen con parámetros dinámicos
router.get('/caja/consulta', authenticateToken, async (req, res) => {
  await cajaController.obtenerCaja(req, res);
});

// Obtener una venta por ID (solo admin) - esta ruta va al final
router.get('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.getVentaById(req, res, next);
});

router.post('/', authenticateToken, async (req, res, next) => {
  await ventasController.createVenta(req, res, next);
});

router.post('/admin', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.createVentaAdmin(req, res, next);
});

router.put('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.updateVenta(req, res, next);
});

router.delete('/:id', authenticateToken, isAdmin, async (req, res, next) => {
  await ventasController.deleteVenta(req, res, next);
});

export default router;
