import { Router } from 'express';
import { Reparacion } from '../Models/Reparaciones';
import { authenticateToken } from '../Middlewares/authMiddlewares';
import { isAdmin } from "../Middlewares/isAdmin";
const router = Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const Reparaciones = await Reparacion.findAll();
    res.json(Reparaciones);
  } catch (error) {
    console.error('Error en /repar:', error);
    res.status(500).json({ message: 'Error al obtener reparaciones' });
  }
});

router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { descripcion, valor, reparadoPor } = req.body;

    if (!descripcion || !valor || !reparadoPor) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const nuevaReparacion = await Reparacion.create({
      descripcion,
      valor,
      reparadoPor,
    });

    res.status(201).json(nuevaReparacion);
  } catch (error) {
    console.error('Error en POST /repar:', error);
    res.status(500).json({ message: 'Error al crear la reparación' });
  }
});


export default router;
