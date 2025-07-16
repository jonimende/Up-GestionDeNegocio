// routes/celulares.ts
import { Router } from 'express';
import { Celular } from '../Models/Celulares';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const celulares = await Celular.findAll();
    res.json(celulares);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener celulares' });
  }
});

export default router;
