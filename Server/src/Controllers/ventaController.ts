import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';

export const ventasController = {
  getVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ventas = await Venta.findAll({
        include: [Celular, Accesorios, Reparacion],
        order: [['fecha', 'DESC']],
      });
      res.status(200).json(ventas);
    } catch (error) {
      next(error);
    }
  },

  createVenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        cantidad,
        total,
        fecha,
        celularId,
        accesorioId,
        reparacionId,
      } = req.body;

      // Validaciones básicas
      if (!cantidad || cantidad <= 0) {
        return res.status(400).json({ error: 'Cantidad inválida' });
      }
      if (!total || total <= 0) {
        return res.status(400).json({ error: 'Total inválido' });
      }
      if (!celularId && !accesorioId && !reparacionId) {
        return res.status(400).json({ error: 'Debe especificar un producto para la venta' });
      }

      // Validar y descontar stock celular si aplica
      if (celularId) {
        const celular = await Celular.findByPk(celularId);
        if (!celular) {
          return res.status(404).json({ error: 'Celular no encontrado' });
        }

        if ((celular.stock ?? 0) < cantidad) {
          return res.status(400).json({ error: 'Stock insuficiente en celular' });
        }

        celular.stock = (celular.stock ?? 0) - cantidad;
        await celular.save();
      }

      // Validar y descontar stock accesorio si aplica
      if (accesorioId) {
        const accesorio = await Accesorios.findByPk(accesorioId);
        if (!accesorio) {
          return res.status(404).json({ error: 'Accesorio no encontrado' });
        }

        if ((accesorio.stock ?? 0) < cantidad) {
          return res.status(400).json({ error: 'Stock insuficiente en accesorio' });
        }

        accesorio.stock = (accesorio.stock ?? 0) - cantidad;
        await accesorio.save();
      }

      // Validar reparación si aplica (no afecta stock)
      if (reparacionId) {
        const reparacion = await Reparacion.findByPk(reparacionId);
        if (!reparacion) {
          return res.status(404).json({ error: 'Reparación no encontrada' });
        }
      }

      const nuevaVenta = await Venta.create({
        cantidad,
        total,
        fecha: fecha || new Date(),
        celularId: celularId || null,
        accesorioId: accesorioId || null,
        reparacionId: reparacionId || null,
      });

      res.status(201).json(nuevaVenta);
    } catch (error) {
      console.error('Error en createVenta:', error);
      next(error);
    }
  },
};
