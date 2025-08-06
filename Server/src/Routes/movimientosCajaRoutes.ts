import { Router } from 'express';
import { cajaController } from '../Controllers/cajaController';
import { authenticateToken } from '../Middlewares/authMiddlewares';

const router = Router();


router.post('/movimientos', authenticateToken, async (req, res) => {
  await cajaController.agregarMovimiento(req, res);
});

router.get('/movimientos/balance', authenticateToken,  async (req, res) => {
  await cajaController.obtenerBalanceCaja(req, res);
});

router.get('/movimientos', authenticateToken, async (req, res) => {
  await cajaController.listarMovimientos(req, res);
});

router.delete("/movimientos/:id", authenticateToken, async (req, res) =>{
  await cajaController.eliminarMovimiento(req, res);
});
export default router;
