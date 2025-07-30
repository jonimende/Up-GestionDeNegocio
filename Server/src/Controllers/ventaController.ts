// Controllers/ventaController.ts
import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';
import sequelize from '../db';

export const ventasController = {
  getVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const ventas = await Venta.findAll({
        include: [
          {
            model: Celular,
            attributes: [
              "modelo", "almacenamiento", "bateria", "color", "precio",
              "observaciones", "costo", "idReparacion", "valorFinal",
              "imei", "ganancia", "idProveedor", "fechaIngreso", "fechaVenta", "comprador"
            ],
            include: [
              { model: Reparacion, as: "reparacion", attributes: ["descripcion", "valor", "reparadoPor"] }
            ],
          },
          {
            model: Accesorios,
            attributes: ["nombre", "precio"],
          },
          {
            model: Reparacion,
            attributes: ["descripcion", "reparadoPor", "valor"],
          },
        ],
        order: [["fecha", "DESC"]],
      });

      res.status(200).json(ventas);
    } catch (error) {
      next(error);
    }
  },

  getVentaById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const idParam = req.params.id;
      const id = parseInt(idParam, 10);

      if (isNaN(id)) {
        return res.status(400).json({ error: 'El id debe ser un número entero válido' });
      }

      const venta = await Venta.findByPk(id, {
        include: [
          { model: Celular },
          { model: Accesorios },
          { model: Reparacion },
        ],
      });

      if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

      res.status(200).json(venta);
    } catch (error) {
      next(error);
    }
  },


  createVenta: async (req: Request, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const {
      cantidad,
      total,
      fecha,
      celularId,
      accesorioId,
      reparacionId,
      metodoPago,
      imei, // <-- agregamos imei aquí, pero no va en la venta
    } = req.body;

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
      metodoPago: metodoPago || null, // <-- guardamos metodoPago en venta
    }, { transaction: t });

    // Solo si enviaron imei y celularId, actualizamos el imei en el celular
    if (celularId && imei) {
      await Celular.update({ imei }, { where: { id: celularId }, transaction: t });
    }

    await t.commit();
    res.status(201).json(nuevaVenta);
  } catch (error) {
    await t.rollback();
    next(error);
  }
},

  updateVenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const venta = await Venta.findByPk(id);
      if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

      // Actualizar incluyendo metodoPago
      await venta.update(req.body);
      res.status(200).json(venta);
    } catch (error) {
      next(error);
    }
  },

  deleteVenta: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const venta = await Venta.findByPk(id);
      if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

      await venta.destroy();
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  createVentaAdmin: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const {
        cantidad,
        total,
        celularId,
        accesorioId,
        reparacionId,
        metodoPago,
        descuento,
        comprador,
        ganancia,
        idProveedor,
      } = req.body;

      if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
      if (!total || total <= 0) return res.status(400).json({ error: 'Total inválido' });

      let fechaVenta = new Date();
      let fechaIngresoCelular: Date | null = null;

      if (celularId) {
        const celular = await Celular.findByPk(celularId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (!celular || (celular.stock ?? 0) < cantidad) {
          await t.rollback();
          return res.status(400).json({ error: 'Celular inválido o stock insuficiente' });
        }

        celular.stock! -= cantidad;

        if (comprador) celular.comprador = comprador;
        if (idProveedor) celular.idProveedor = idProveedor;
        if (ganancia) celular.ganancia = ganancia;
        celular.fechaVenta = new Date();

        await celular.save({ transaction: t });

        fechaIngresoCelular = celular.fechaIngreso || null;
      }

      if (accesorioId) {
        const accesorio = await Accesorios.findByPk(accesorioId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

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
        ganancia: ganancia || null,
        idProveedor: idProveedor || null,
      }, { transaction: t });

      await t.commit();
      res.status(201).json(nuevaVenta);
    } catch (error) {
      await t.rollback();
      next(error);
    }
  }
};
