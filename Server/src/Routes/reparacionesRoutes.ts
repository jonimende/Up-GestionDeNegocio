// routes/celulares.ts
import { Router } from 'express';
import { Reparacion } from '../Models/Reparaciones';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const Reparaciones = await Reparacion.findAll();
    res.json(Reparaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener celulares' });
  }
});

export default router;
