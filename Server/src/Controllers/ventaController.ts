import { Request, Response, NextFunction } from 'express';
import { Venta } from '../Models/Ventas';
import { Celular } from '../Models/Celulares';
import { Accesorios } from '../Models/Accesorios';
import { Reparacion } from '../Models/Reparaciones';
import { Proveedor } from '../Models/Proveedores';
import { sequelize } from '../db';

export const ventasController = {
  getVentas: async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Obteniendo todas las ventas...');
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
              { model: Reparacion, as: "reparacion", attributes: ["descripcion", "valor", "reparadoPor"] },
              { model: Proveedor, as: "proveedor", attributes: ["id", "nombre"] },
            ],
          },
          { model: Accesorios, as: 'Accesorio', attributes: ["nombre", "precio", "vendido"] },
          { model: Reparacion, attributes: ["descripcion", "reparadoPor", "valor"] },
          { model: Proveedor, attributes: ["id", "nombre"] },
        ],
        order: [["fecha", "DESC"]],
      });
      console.log(`Se encontraron ${ventas.length} ventas.`);
      res.status(200).json(ventas);
    } catch (error) {
      console.error('Error en getVentas:', error);
      next(error);
    }
  },

  getVentaById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        console.warn(`ID inválido recibido: ${req.params.id}`);
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
          { model: Accesorios, as: 'Accesorio', attributes: ["nombre", "precio", "vendido"] },
          { model: Reparacion },
          { model: Proveedor, attributes: ["id", "nombre"] },
        ],
      });

      if (!venta) {
        console.warn(`Venta con id ${id} no encontrada.`);
        return res.status(404).json({ error: "Venta no encontrada" });
      }
      console.log(`Venta con id ${id} encontrada.`);
      res.status(200).json(venta);
    } catch (error) {
      console.error('Error en getVentaById:', error);
      next(error);
    }
  },

  createVenta: async (req: Request, res: Response, next: NextFunction) => {
  const t = await sequelize.transaction();
  try {
    console.log('Creando nueva venta con datos:', req.body);

    const {
      cantidad,
      total,
      fecha,
      celularId,
      accesorioId,
      reparacionId,
      metodoPago,
      comprador,
      imei,
    } = req.body;

    if (!cantidad || cantidad <= 0) {
      console.warn('Cantidad inválida:', cantidad);
      await t.rollback();
      return res.status(400).json({ error: 'Cantidad inválida' });
    }
    if (!total || total <= 0) {
      console.warn('Total inválido:', total);
      await t.rollback();
      return res.status(400).json({ error: 'Total inválido' });
    }
    if (!celularId && !accesorioId && !reparacionId) {
      console.warn('No se especificó producto en la venta');
      await t.rollback();
      return res.status(400).json({ error: 'Debe especificar un producto' });
    }

   // En createVenta y createVentaAdmin, reemplaza la lógica relacionada con celulares por esta:

    if (celularId) {
      const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!celular) {
        await t.rollback();
        return res.status(400).json({ error: 'Celular no encontrado' });
      }

      if (celular.stock == null) {
        await t.rollback();
        return res.status(400).json({ error: 'El stock del celular es inválido (null)' });
      }

      if (cantidad > celular.stock) {
        await t.rollback();
        return res.status(400).json({ error: 'Cantidad solicitada supera el stock disponible' });
      }

      celular.stock -= cantidad;

      // Marca como vendido solo si stock queda en 0
      celular.vendido = celular.stock === 0;

      // Actualizamos la fecha de venta solo si stock llega a 0
      if (celular.vendido) {
        celular.fechaVenta = new Date();
      }

      if (comprador !== undefined && comprador !== null) {
        celular.comprador = comprador;
      }

      await celular.save({ transaction: t });

      console.log(`✅ Celular ${celularId} actualizado:`);
      console.log(`   - Stock restante: ${celular.stock}`);
      console.log(`   - Vendido: ${celular.vendido ? 'Sí' : 'No'}`);
    }

    if (accesorioId) {
      const accesorio = await Accesorios.findByPk(accesorioId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!accesorio) {
        console.warn(`Accesorio con id ${accesorioId} no encontrado.`);
        await t.rollback();
        return res.status(400).json({ error: 'Accesorio no encontrado' });
      }

      if (accesorio.stock == null) {
        console.warn('Stock del accesorio es null');
        await t.rollback();
        return res.status(400).json({ error: 'El stock del accesorio es inválido (null)' });
      }

      if (cantidad > accesorio.stock) {
        console.warn(`Cantidad solicitada ${cantidad} supera stock disponible ${accesorio.stock}`);
        await t.rollback();
        return res.status(400).json({ error: 'Cantidad solicitada supera el stock disponible' });
      }

      accesorio.stock -= cantidad;
      accesorio.vendido = accesorio.stock === 0;

      await accesorio.save({ transaction: t });

      console.log(`✅ Accesorio ${accesorioId} actualizado:`);
      console.log(`   - Stock restante: ${accesorio.stock}`);
      console.log(`   - Vendido: ${accesorio.vendido ? 'Sí' : 'No'}`);
    }

    if (reparacionId) {
      const reparacion = await Reparacion.findByPk(reparacionId, { transaction: t });
      if (!reparacion) {
        console.warn(`Reparación con id ${reparacionId} no encontrada`);
        await t.rollback();
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
      metodoPago: metodoPago || null,
      comprador: comprador || null,
    }, { transaction: t });

    if (celularId) {
      const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
      if (celular) {
        if (imei) celular.imei = imei;
       //celular.vendido = true;
        await celular.save({ transaction: t });
        console.log(`Celular ${celularId} marcado como vendido.`);
      }
    }

    await t.commit();
    console.log('Venta creada exitosamente:', nuevaVenta.id);
    res.status(201).json(nuevaVenta);

  } catch (error) {
    await t.rollback();
    console.error('Error en createVenta:', error);
    next(error);
  }
},


  updateVenta: async (req: Request, res: Response, next: NextFunction) => {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      console.log(`Actualizando venta con id: ${id}`);

      const venta = await Venta.findByPk(id);
      if (!venta) {
        console.warn(`Venta con id ${id} no encontrada para actualizar.`);
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      const { cantidad, total, fecha, celularId, accesorioId, reparacionId, metodoPago, descuento } = req.body;
      console.log('Datos para actualización:', req.body);

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

      if (venta.celularId) {
        const celular = await Celular.findByPk(venta.celularId, { transaction: t });
        if (celular) {
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
          console.log(`Celular ${celular.id} actualizado correctamente.`);
        }
      }

      await t.commit();
      console.log(`Venta con id ${id} actualizada con éxito.`);
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
      console.log(`Eliminando venta con id: ${id}`);

      const venta = await Venta.findByPk(id, { transaction: t });
      if (!venta) {
        console.warn(`Venta con id ${id} no encontrada para eliminar.`);
        return res.status(404).json({ error: 'Venta no encontrada' });
      }

      // Restaurar stock y estado accesorio si aplica
      if (venta.accesorioId) {
        const accesorio = await Accesorios.findByPk(venta.accesorioId, { transaction: t, lock: t.LOCK.UPDATE });
        if (accesorio) {
          console.log(`Restaurando stock del accesorio ${accesorio.id} por eliminación de venta.`);
          accesorio.stock! += venta.cantidad;
          if (accesorio.stock! > 0) {
            accesorio.vendido = false;
          }
          await accesorio.save({ transaction: t });
          console.log(`Stock actualizado a ${accesorio.stock}, vendido: ${accesorio.vendido}`);
        }
      }

      // Aquí podrías agregar restauración para celular si corresponde

      await venta.destroy({ transaction: t });
      await t.commit();
      console.log(`Venta con id ${id} eliminada correctamente.`);
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
    console.log('Creando venta admin con datos:', req.body);

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
      proveedorNombre,  // NUEVO campo para nombre de proveedor
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

    // Validación y creación de proveedor nuevo si es necesario
    let proveedorIdFinal = idProveedor || null;

    if ((!proveedorIdFinal || proveedorIdFinal === null) && proveedorNombre && proveedorNombre.trim() !== "") {
      // Buscar proveedor existente por nombre
      const proveedorExistente = await Proveedor.findOne({
        where: { nombre: proveedorNombre.trim() },
        transaction: t,
      });
      if (proveedorExistente) {
        proveedorIdFinal = proveedorExistente.id;
      } else {
        // Crear proveedor nuevo
        const nuevoProveedor = await Proveedor.create(
          { nombre: proveedorNombre.trim() },
          { transaction: t }
        );
        proveedorIdFinal = nuevoProveedor.id;
      }
      console.log(`Proveedor usado: ID=${proveedorIdFinal}`);
    }

    if (celularId) {
      const celular = await Celular.findByPk(celularId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!celular) {
        await t.rollback();
        return res.status(400).json({ error: 'Celular no encontrado' });
      }
      if (celular.stock == null) {
        await t.rollback();
        return res.status(400).json({ error: 'El stock del celular es inválido (null)' });
      }
      if (cantidad > celular.stock) {
        await t.rollback();
        return res.status(400).json({ error: 'Cantidad solicitada supera el stock disponible' });
      }
      celular.stock -= cantidad;
      celular.vendido = celular.stock === 0;
      if (imei) celular.imei = imei;
      if (celular.vendido) {
        celular.fechaVenta = new Date();
      }
      if (comprador !== undefined && comprador !== null) {
        celular.comprador = comprador;
      }
      if (proveedorIdFinal !== null) {
        celular.idProveedor = proveedorIdFinal;
      }
      if (ganancia !== undefined && ganancia !== null) {
        celular.ganancia = ganancia;
      }
      await celular.save({ transaction: t });
    }

    if (accesorioId) {
      const accesorio = await Accesorios.findByPk(accesorioId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      if (!accesorio) {
        await t.rollback();
        return res.status(400).json({ error: 'Accesorio no encontrado' });
      }
      if (accesorio.stock == null) {
        await t.rollback();
        return res.status(400).json({ error: 'El stock del accesorio es inválido (null)' });
      }
      if (cantidad > accesorio.stock) {
        await t.rollback();
        return res.status(400).json({ error: 'Cantidad solicitada supera el stock disponible' });
      }
      accesorio.stock -= cantidad;
      accesorio.vendido = accesorio.stock === 0;
      await accesorio.save({ transaction: t });
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
      accesorioId: accesorioId || null,
      reparacionId: reparacionId || null,
      metodoPago: metodoPago || null,
      descuento: descuento || null,
      comprador: comprador || null,
      ganancia: ganancia || null,
      idProveedor: proveedorIdFinal,
    }, { transaction: t });

    await t.commit();
    console.log('Venta admin creada exitosamente:', nuevaVenta.id);
    res.status(201).json(nuevaVenta);

  } catch (error) {
    await t.rollback();
    console.error('Error en createVentaAdmin:', error);
    next(error);
  }
},
};
