// routes/celulares.ts
import { Router } from 'express';
import { Accesorios } from '../Models/Accesorios';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const Accesorio = await Accesorios.findAll();
    res.json(Accesorio);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener Accesorios' });
  }
});

export default router;
