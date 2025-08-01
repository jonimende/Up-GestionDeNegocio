import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';
import { Proveedor } from '../Models/Proveedores';
import sequelize from '../db';

export const ventasController = {
  getVentas: async (req: Request, res: Response, next: NextFunction) => {
  try {
    const ventas = await Venta.findAll({
      include: [
        {
          model: Celular,
          attributes: [
            "modelo",
            "almacenamiento",
            "bateria",
            "color",
            "precio",
            "observaciones",
            "costo",
            "idReparacion",
            "valorFinal",
            "imei",
            "ganancia",
            "idProveedor",
            "fechaIngreso",
            "fechaVenta",
            "comprador",
            "vendido",
          ],
          include: [
            {
              model: Reparacion,
              as: "reparacion",
              attributes: ["descripcion", "valor", "reparadoPor"],
            },
            {
              model: Proveedor,
              as: "proveedor",  // importante usar el alias definido en la relación
              attributes: ["id", "nombre"],
            },
          ],
        },
        {
          model: Accesorios,
          attributes: ["nombre", "precio", "vendido"],
        },
        {
          model: Reparacion,
          attributes: ["descripcion", "reparadoPor", "valor"],
        },
        {
          model: Proveedor, // también agrego el proveedor directo de la venta, si aplica
          attributes: ["id", "nombre"],
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: "ID inválido" });

    const venta = await Venta.findByPk(id, {
      include: [
        {
          model: Celular,
          include: [
            {
              model: Reparacion,
              as: "reparacion",
              attributes: ["descripcion", "valor", "reparadoPor"],
            },
            {
              model: Proveedor,
              as: "proveedor",
              attributes: ["id", "nombre"],
            },
          ],
        },
        { model: Accesorios },
        { model: Reparacion },
        {
          model: Proveedor,
          attributes: ["id", "nombre"],
        },
      ],
    });

    if (!venta) return res.status(404).json({ error: "Venta no encontrada" });

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
        imei,
      } = req.body;

      // Validaciones básicas
      if (!cantidad || cantidad <= 0) return res.status(400).json({ error: 'Cantidad inválida' });
      if (!total || total <= 0) return res.status(400).json({ error: 'Total inválido' });
      if (!celularId && !accesorioId && !reparacionId) return res.status(400).json({ error: 'Debe especificar un producto' });

      // Validar existencia de celular si se envió
      if (celularId) {
        const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!celular) {
          await t.rollback();
          return res.status(400).json({ error: 'Celular no encontrado' });
        }
      }

      // Validar accesorio
      if (accesorioId) {
        const accesorio = await Accesorios.findByPk(accesorioId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!accesorio) {
          await t.rollback();
          return res.status(400).json({ error: 'Accesorio no encontrado' });
        }
      }

      // Validar reparación
      if (reparacionId) {
        const reparacion = await Reparacion.findByPk(reparacionId, { transaction: t });
        if (!reparacion) {
          await t.rollback();
          return res.status(404).json({ error: 'Reparación no encontrada' });
        }
      }

      // Crear la venta primero
      const nuevaVenta = await Venta.create({
        cantidad,
        total,
        fecha: fecha || new Date(),
        celularId: celularId || null,
        accesorioId: accesorioId || null,
        reparacionId: reparacionId || null,
        metodoPago: metodoPago || null,
      }, { transaction: t });

      // Actualizar celular: marcar vendido en lugar de eliminar
      if (celularId) {
        const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
        if (celular) {
          if (imei) {
            celular.imei = imei;
          }
          celular.vendido = true; // marcar vendido
          await celular.save({ transaction: t });
        }
      }

      // Actualizar accesorio: marcar vendido
      if (accesorioId) {
        const accesorio = await Accesorios.findByPk(accesorioId, { transaction: t, lock: t.LOCK.UPDATE });
        if (accesorio) {
          accesorio.vendido = true;
          await accesorio.save({ transaction: t });
        }
      }

      await t.commit();
      res.status(201).json(nuevaVenta);

    } catch (error) {
      await t.rollback();
      next(error);
    }
  },

  updateVenta: async (req: Request, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const venta = await Venta.findByPk(id);
    if (!venta) return res.status(404).json({ error: 'Venta no encontrada' });

    // Campos para actualizar en Venta
    const { cantidad, total, fecha, celularId, accesorioId, reparacionId, metodoPago, descuento } = req.body;

    await venta.update({
      ...(cantidad !== undefined && { cantidad }),
      ...(total !== undefined && { total }),
      ...(fecha !== undefined && { fecha }),
      ...(celularId !== undefined && { celularId }),
      ...(accesorioId !== undefined && { accesorioId }),
      ...(reparacionId !== undefined && { reparacionId }),
      ...(metodoPago !== undefined && { metodoPago }),
      ...(descuento !== undefined && { descuento }),
    }, { transaction: t });

    // Actualizar datos de Celular solo si la venta tiene celularId
    if (venta.celularId) {
      const celular = await Celular.findByPk(venta.celularId, { transaction: t });
      if (celular) {
        // Extraemos los campos planos que vienen en req.body, no el objeto Celular completo
        const {
          comprador,
          ganancia,
          idProveedor,
          fechaVenta,
          modelo,
          almacenamiento,
          bateria,
          color,
          precio,
          imei,
          observaciones,
        } = req.body;

        if (comprador !== undefined) celular.comprador = comprador;
        if (ganancia !== undefined) celular.ganancia = ganancia;
        if (idProveedor !== undefined && idProveedor !== null) celular.idProveedor = idProveedor;
        if (fechaVenta !== undefined) celular.fechaVenta = fechaVenta;
        if (modelo !== undefined) celular.modelo = modelo;
        if (almacenamiento !== undefined) celular.almacenamiento = almacenamiento;
        if (bateria !== undefined) celular.bateria = bateria;
        if (color !== undefined) celular.color = color;
        if (precio !== undefined) celular.precio = precio;
        if (imei !== undefined) celular.imei = imei;
        if (observaciones !== undefined) celular.observaciones = observaciones;

        await celular.save({ transaction: t });
      }
    }

    await t.commit();
    res.status(200).json(venta);
  } catch (error) {
    await t.rollback();
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

    if (celularId) {
      const celularExists = await Celular.findByPk(celularId, { transaction: t });
      if (!celularExists) {
        await t.rollback();
        return res.status(400).json({ error: `Celular con id ${celularId} no existe` });
      }
    }

    if (accesorioId) {
      const accesorioExists = await Accesorios.findByPk(accesorioId, { transaction: t });
      if (!accesorioExists) {
        await t.rollback();
        return res.status(400).json({ error: 'Accesorio no encontrado' });
      }
    }

    if (reparacionId) {
      const reparacionExists = await Reparacion.findByPk(reparacionId, { transaction: t });
      if (!reparacionExists) {
        await t.rollback();
        return res.status(404).json({ error: 'Reparación no encontrada' });
      }
    }

    // Crear la venta primero
    const nuevaVenta = await Venta.create({
      cantidad,
      total,
      fecha: new Date(),
      celularId: celularId || null,
      accesorioId: accesorioId || null,
      reparacionId: reparacionId || null,
      metodoPago: metodoPago || null,
      descuento: descuento || null,
      comprador: comprador || null,
      ganancia: ganancia || null,
      idProveedor: idProveedor || null,
    }, { transaction: t });

    // Actualizar celular: marcar vendido
    if (celularId) {
      const celular = await Celular.findByPk(celularId, { transaction: t });
      if (celular) {
        if (comprador !== undefined && comprador !== null) celular.comprador = comprador;
        if (idProveedor !== undefined && idProveedor !== null) celular.idProveedor = idProveedor;
        if (ganancia !== undefined && ganancia !== null) celular.ganancia = ganancia;
        celular.fechaVenta = new Date();
        celular.vendido = true; // marcar vendido
        await celular.save({ transaction: t });
      }
    }

    // Marcar accesorio vendido
    if (accesorioId) {
      const accesorio = await Accesorios.findByPk(accesorioId, { transaction: t });
      if (accesorio) {
        accesorio.vendido = true;
        await accesorio.save({ transaction: t });
      }
    }

    await t.commit();
    res.status(201).json(nuevaVenta);

  } catch (error) {
    await t.rollback();
    next(error);
  }
},

};
