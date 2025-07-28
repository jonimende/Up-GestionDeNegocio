// routes/celulares.ts
import { Router } from 'express';
import { Reparacion } from '../Models/Reparaciones';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const Reparaciones = await Reparacion.findAll();
    res.json(Reparaciones);
  } catch (error) {
    console.error('Error en /repar:', error);
    res.status(500).json({ message: 'Error al obtener reparaciones' });
  }
});

export default router;
