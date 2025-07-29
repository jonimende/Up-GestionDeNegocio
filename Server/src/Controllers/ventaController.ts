// Controllers/ventaController.ts
import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';
import sequelize from '../db';

export const ventasController = {
  // Traer todas las ventas
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

  // Venta normal (usuario común)
  createVenta: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const { cantidad, total, fecha, celularId, accesorioId, reparacionId } = req.body;

      if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
      if (!total || total <= 0) return res.status(400).json({ error: 'Total inválido' });
      if (!celularId && !accesorioId && !reparacionId) return res.status(400).json({ error: 'Debe especificar un producto' });

      if (celularId) {
        const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!celular || (celular.stock ?? 0) < cantidad) return res.status(400).json({ error: 'Celular inválido o stock insuficiente' });
        celular.stock! -= cantidad;
        await celular.save({ transaction: t });
      }

      if (accesorioId) {
        const accesorio = await Accesorios.findByPk(accesorioId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!accesorio || (accesorio.stock ?? 0) < cantidad) return res.status(400).json({ error: 'Accesorio inválido o stock insuficiente' });
        accesorio.stock! -= cantidad;
        await accesorio.save({ transaction: t });
      }

      if (reparacionId) {
        const reparacion = await Reparacion.findByPk(reparacionId, { transaction: t });
        if (!reparacion) return res.status(404).json({ error: 'Reparación no encontrada' });
      }

      const nuevaVenta = await Venta.create({
        cantidad,
        total,
        fecha: fecha || new Date(),
        celularId: celularId || null,
        accesorioId: accesorioId || null,
        reparacionId: reparacionId || null,
      }, { transaction: t });

      await t.commit();
      res.status(201).json(nuevaVenta);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  },

  // Venta extendida (solo admin)
  createVentaAdmin: async (req: Request, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const {
      cantidad,
      total,
      // fecha,  // Lo sacamos para que no se use directamente
      celularId,
      accesorioId,
      reparacionId,
      metodoPago,
      descuento,
      comprador,
    } = req.body;

    if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
    if (!total || total <= 0) return res.status(400).json({ error: 'Total inválido' });

    let fechaVenta = new Date(); // Fecha por defecto para la venta
    let fechaIngresoCelular: Date | null = null;

    if (celularId) {
      const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!celular || (celular.stock ?? 0) < cantidad) {
        await t.rollback();
        return res.status(400).json({ error: 'Celular inválido o stock insuficiente' });
      }
      // Descontar stock
      celular.stock! -= cantidad;
      await celular.save({ transaction: t });

      // Obtener fechaIngreso del celular para usar como fecha de la venta
      fechaIngresoCelular = celular.fechaIngreso || null;
    }

    if (accesorioId) {
      const accesorio = await Accesorios.findByPk(accesorioId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!accesorio || (accesorio.stock ?? 0) < cantidad) {
        await t.rollback();
        return res.status(400).json({ error: 'Accesorio inválido o stock insuficiente' });
      }
      accesorio.stock! -= cantidad;
      await accesorio.save({ transaction: t });
    }

    if (reparacionId) {
      const reparacion = await Reparacion.findByPk(reparacionId, { transaction: t });
      if (!reparacion) {
        await t.rollback();
        return res.status(404).json({ error: 'Reparación no encontrada' });
      }
    }

    // Si tenemos fechaIngresoCelular la usamos, sino la fecha actual
    fechaVenta = fechaIngresoCelular ?? new Date();

    const nuevaVenta = await Venta.create({
      cantidad,
      total,
      fecha: fechaVenta,
      celularId: celularId || null,
      accesorioId: accesorioId || null,
      reparacionId: reparacionId || null,
      metodoPago: metodoPago || null,
      descuento: descuento || null,
      comprador: comprador || null,
    }, { transaction: t });

    await t.commit();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    await t.rollback();
    next(error);
  }
},
}