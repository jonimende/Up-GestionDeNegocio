import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';
import { Proveedor } from '../Models/Proveedores';
import { sequelize } from '../db';
import { VentaAccesorio } from '../Models/VentaAccesorio';

export const ventasController = {
  getVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log("Obteniendo todas las ventas...");
      const ventas = await Venta.findAll({
        include: [
          {
            model: Celular,
            attributes: [
              "modelo", "almacenamiento", "bateria", "color", "precio",
              "observaciones", "costo", "idReparacion", "valorFinal",
              "imei", "ganancia", "idProveedor", "fechaIngreso",
              "fechaVenta", "comprador", "vendido",
            ],
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
          { model: Reparacion, attributes: ["descripcion", "reparadoPor", "valor"] },
          { model: Proveedor, attributes: ["id", "nombre"] },
          {
            model: Accesorios,
            as: "accesorios",
            attributes: ["id", "nombre", "precio"],
            through: { attributes: ["cantidad"] },
          },
        ],
        order: [["fecha", "DESC"]],
      });

      console.log(`Se encontraron ${ventas.length} ventas.`);
      res.status(200).json(ventas);
    } catch (error) {
      console.error("Error en getVentas:", error);
      next(error);
    }
  },

  getVentaById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ error: "ID inválido" });
      }
      console.log(`Buscando venta con id: ${id}`);
      const venta = await Venta.findByPk(id, {
        include: [
          {
            model: Celular,
            include: [
              { model: Reparacion, as: "reparacion", attributes: ["descripcion", "valor", "reparadoPor"] },
              { model: Proveedor, as: "proveedor", attributes: ["id", "nombre"] },
            ],
          },
          { model: Reparacion },
          { model: Proveedor, attributes: ["id", "nombre"] },
          {
            model: Accesorios,
            as: "accesorios",
            attributes: ["id", "nombre", "precio"],
            through: { attributes: ["cantidad"] },
          },
        ],
      });

      if (!venta) {
        return res.status(404).json({ error: "Venta no encontrada" });
      }
      res.status(200).json(venta);
    } catch (error) {
      console.error('Error en getVentaById:', error);
      next(error);
    }
  },

  createVenta: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      console.log("Creando nueva venta con datos:", req.body);

      const {
        cantidad,
        total,
        fecha,
        celularId,
        accesorios, // [{id, cantidad}]
        reparacionId,
        metodoPago,
        comprador,
        imei,
      } = req.body;

      if (!cantidad || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ error: "Cantidad inválida" });
      }
      if (!total || total <= 0) {
        await t.rollback();
        return res.status(400).json({ error: "Total inválido" });
      }
      if (!celularId && (!accesorios || accesorios.length === 0) && !reparacionId) {
        await t.rollback();
        return res.status(400).json({ error: "Debe especificar un producto" });
      }

      // Celular
      if (celularId) {
        const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!celular) {
          await t.rollback();
          return res.status(400).json({ error: "Celular no encontrado" });
        }
        if (cantidad > celular.stock) {
          await t.rollback();
          return res.status(400).json({ error: "Cantidad solicitada supera stock disponible" });
        }
        celular.stock -= cantidad;
        celular.vendido = celular.stock === 0;
        if (celular.vendido) celular.fechaVenta = new Date();
        if (comprador) celular.comprador = comprador;
        await celular.save({ transaction: t });
      }

      // Accesorios
      if (accesorios && Array.isArray(accesorios)) {
        for (const { id, cantidad } of accesorios) {
          const accesorio = await Accesorios.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!accesorio) {
            await t.rollback();
            return res.status(400).json({ error: `Accesorio ${id} no encontrado` });
          }
          if (cantidad > accesorio.stock) {
            await t.rollback();
            return res.status(400).json({ error: `Stock insuficiente para accesorio ${id}` });
          }
          accesorio.stock -= cantidad;
          accesorio.vendido = accesorio.stock === 0;
          await accesorio.save({ transaction: t });
        }
      }

      if (reparacionId) {
        const reparacion = await Reparacion.findByPk(reparacionId, { transaction: t });
        if (!reparacion) {
          await t.rollback();
          return res.status(404).json({ error: "Reparación no encontrada" });
        }
      }

      const nuevaVenta = await Venta.create(
        {
          cantidad,
          total,
          fecha: fecha || new Date(),
          celularId: celularId || null,
          reparacionId: reparacionId || null,
          metodoPago: metodoPago || null,
          comprador: comprador || null,
        },
        { transaction: t }
      );

      if (accesorios && Array.isArray(accesorios)) {
        for (const { id, cantidad } of accesorios) {
          await VentaAccesorio.create(
            { ventaId: nuevaVenta.id, accesorioId: id, cantidad },
            { transaction: t }
          );
        }
      }

      await t.commit();
      res.status(201).json(nuevaVenta);
    } catch (error) {
      await t.rollback();
      console.error("Error en createVenta:", error);
      next(error);
    }
  },

  updateVenta: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const venta = await Venta.findByPk(id, { transaction: t });
      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const { cantidad, total, fecha, celularId, reparacionId, metodoPago, descuento, accesorios } = req.body;

      await venta.update({
        ...(cantidad !== undefined && { cantidad }),
        ...(total !== undefined && { total }),
        ...(fecha !== undefined && { fecha }),
        ...(celularId !== undefined && { celularId }),
        ...(reparacionId !== undefined && { reparacionId }),
        ...(metodoPago !== undefined && { metodoPago }),
        ...(descuento !== undefined && { descuento }),
      }, { transaction: t });

      if (Array.isArray(accesorios)) {
        await VentaAccesorio.destroy({ where: { ventaId: venta.id }, transaction: t });
        for (const { id: accesorioId, cantidad } of accesorios) {
          await VentaAccesorio.create({ ventaId: venta.id, accesorioId, cantidad }, { transaction: t });
        }
      }

      await t.commit();
      res.status(200).json(venta);
    } catch (error) {
      await t.rollback();
      console.error('Error en updateVenta:', error);
      next(error);
    }
  },

  deleteVenta: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const venta = await Venta.findByPk(id, {
        include: [{ model: Accesorios, as: "accesorios", through:  { attributes: ["cantidad"] } }],
        transaction: t,
      });
      if (!venta) {
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      if (venta.accesorios && venta.accesorios.length > 0) {
        for (const accesorio of venta.accesorios) {
          const cantidad = (accesorio as any).VentaAccesorio.cantidad;
          const acc = await Accesorios.findByPk(accesorio.id, { transaction: t, lock: t.LOCK.UPDATE });
          if (acc) {
            acc.stock! += cantidad;
            acc.vendido = false;
            await acc.save({ transaction: t });
          }
        }
        await VentaAccesorio.destroy({ where: { ventaId: venta.id }, transaction: t });
      }

      await venta.destroy({ transaction: t });
      await t.commit();
      res.status(204).send();
    } catch (error) {
      await t.rollback();
      console.error('Error en deleteVenta:', error);
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
        accesorios, // [{id, cantidad}]
        reparacionId,
        metodoPago,
        descuento,
        comprador,
        ganancia,
        idProveedor,
        proveedorNombre,
        imei,
      } = req.body;

      if (!cantidad || cantidad <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Cantidad inválida' });
      }
      if (!total || total <= 0) {
        await t.rollback();
        return res.status(400).json({ error: 'Total inválido' });
      }

      let proveedorIdFinal = idProveedor || null;

      if ((!proveedorIdFinal || proveedorIdFinal === null) && proveedorNombre && proveedorNombre.trim() !== "") {
        const proveedorExistente = await Proveedor.findOne({ where: { nombre: proveedorNombre.trim() }, transaction: t });
        if (proveedorExistente) {
          proveedorIdFinal = proveedorExistente.id;
        } else {
          const nuevoProveedor = await Proveedor.create({ nombre: proveedorNombre.trim() }, { transaction: t });
          proveedorIdFinal = nuevoProveedor.id;
        }
      }

      if (celularId) {
        const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
        if (!celular) {
          await t.rollback();
          return res.status(400).json({ error: 'Celular no encontrado' });
        }
        if (cantidad > celular.stock) {
          await t.rollback();
          return res.status(400).json({ error: 'Cantidad solicitada supera el stock disponible' });
        }
        celular.stock -= cantidad;
        celular.vendido = celular.stock === 0;
        if (imei) celular.imei = imei;
        if (celular.vendido) celular.fechaVenta = new Date();
        if (comprador) celular.comprador = comprador;
        if (proveedorIdFinal !== null) celular.idProveedor = proveedorIdFinal;
        if (ganancia !== undefined) celular.ganancia = ganancia;
        await celular.save({ transaction: t });
      }

      if (Array.isArray(accesorios)) {
        for (const { id, cantidad } of accesorios) {
          const accesorio = await Accesorios.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
          if (!accesorio) {
            await t.rollback();
            return res.status(400).json({ error: `Accesorio ${id} no encontrado` });
          }
          if (cantidad > accesorio.stock) {
            await t.rollback();
            return res.status(400).json({ error: `Stock insuficiente para accesorio ${id}` });
          }
          accesorio.stock -= cantidad;
          accesorio.vendido = accesorio.stock === 0;
          await accesorio.save({ transaction: t });
        }
      }

      if (reparacionId) {
        const reparacionExists = await Reparacion.findByPk(reparacionId, { transaction: t });
        if (!reparacionExists) {
          await t.rollback();
          return res.status(404).json({ error: 'Reparación no encontrada' });
        }
      }

      const nuevaVenta = await Venta.create({
        cantidad,
        total,
        fecha: new Date(),
        celularId: celularId || null,
        reparacionId: reparacionId || null,
        metodoPago: metodoPago || null,
        descuento: descuento || null,
        comprador: comprador || null,
        ganancia: ganancia || null,
        idProveedor: proveedorIdFinal,
      }, { transaction: t });

      if (Array.isArray(accesorios)) {
        for (const { id, cantidad } of accesorios) {
          await VentaAccesorio.create({ ventaId: nuevaVenta.id, accesorioId: id, cantidad }, { transaction: t });
        }
      }

      await t.commit();
      res.status(201).json(nuevaVenta);
    } catch (error) {
      await t.rollback();
      console.error('Error en createVentaAdmin:', error);
      next(error);
    }
  },
};
