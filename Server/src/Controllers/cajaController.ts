import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Venta } from '../Models/Ventas';
import { MovimientoCaja } from '../Models/MovimientoCaja';

export const cajaController = {
  obtenerCaja: async function (req: Request, res: Response) {
    try {
      const tipo = req.query.tipo as string;
      const metodoPago = req.query.metodoPago as string;

      if (!tipo || (tipo !== 'diaria' && tipo !== 'mensual')) {
        return res.status(400).json({ error: 'Tipo inválido. Debe ser "diaria" o "mensual".' });
      }

      const ahora = new Date();
      let inicio: Date;

      if (tipo === 'diaria') {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
      } else {
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
      }

      const whereBase: WhereOptions = {
        fecha: { [Op.between]: [inicio, ahora] },
      };

      if (metodoPago && metodoPago !== 'Todos') {
        whereBase['metodoPago'] = metodoPago;
      }

      // Traer todas las ventas en el rango
      const ventas = await Venta.findAll({ where: whereBase });

      let totalGeneral = 0;
      let cantidadGeneral = 0;

      let totalCelulares = 0;
      let cantidadCelulares = 0;

      let totalAccesorios = 0;
      let cantidadAccesorios = 0;

      ventas.forEach((venta) => {
        const monto = parseFloat(venta.total.toString());
        const cant = venta.cantidad;
        const tieneCelular = !!venta.celularId;
        const tieneAccesorio = !!venta.accesorioId;

        totalGeneral += monto;
        cantidadGeneral += cant;

        if (tieneCelular && !tieneAccesorio) {
          totalCelulares += monto;
          cantidadCelulares += cant;
        } else if (!tieneCelular && tieneAccesorio) {
          totalAccesorios += monto;
          cantidadAccesorios += cant;
        } else if (tieneCelular && tieneAccesorio) {
          // Clasificar por defecto como venta de celular
          totalCelulares += monto;
          cantidadCelulares += cant;
        }
      });

      // Movimientos (gastos y retiros)
      const movimientos = await MovimientoCaja.findAll({
        where: {
          fecha: { [Op.between]: [inicio, ahora] },
          ...(metodoPago && metodoPago !== 'Todos' ? { metodoPago } : {}),
        },
        order: [['fecha', 'DESC']],
      });

      const totalMovimientos = movimientos.reduce(
        (acc, mov) => acc + parseFloat(mov.monto.toString()),
        0
      );

      const totalNeto = totalGeneral - totalMovimientos;
      const balance = totalNeto;

      res.json({
        total: totalGeneral,
        cantidad: cantidadGeneral,
        metodoPago: metodoPago || 'Todos',
        totalNeto,
        balance,
        movimientos,
        celulares: {
          total: totalCelulares,
          cantidad: cantidadCelulares,
        },
        accesorios: {
          total: totalAccesorios,
          cantidad: cantidadAccesorios,
        },
      });
    } catch (err) {
      console.error('Error en obtenerCaja:', err);
      res.status(500).json({ error: 'Error al calcular la caja', detalle: err });
    }
  },

  agregarMovimiento: async function (req: Request, res: Response) {
    try {
      const { tipoMovimiento, monto, metodoPago, descripcion, usuarioId } = req.body;

      if (!['gasto', 'retiro'].includes(tipoMovimiento)) {
        return res.status(400).json({ error: 'Tipo de movimiento inválido' });
      }
      if (monto === undefined || isNaN(monto) || monto <= 0) {
        return res.status(400).json({ error: 'Monto inválido' });
      }
      if (!metodoPago) {
        return res.status(400).json({ error: 'Método de pago es obligatorio' });
      }

      const nuevoMovimiento = await MovimientoCaja.create({
        tipoMovimiento,
        monto,
        metodoPago,
        descripcion,
        usuarioId,
        fecha: new Date(),
      });

      res.status(201).json(nuevoMovimiento);
    } catch (error) {
      console.error('Error agregando movimiento:', error);
      res.status(500).json({ error: 'Error al agregar movimiento' });
    }
  },

  obtenerBalanceCaja: async function (req: Request, res: Response) {
    try {
      const totalIngresos = (await Venta.sum('total')) || 0;
      const totalEgresos = (await MovimientoCaja.sum('monto')) || 0;

      const balance = totalIngresos - totalEgresos;

      res.json({ balance, totalIngresos, totalEgresos });
    } catch (error) {
      console.error('Error obteniendo balance caja:', error);
      res.status(500).json({ error: 'Error al obtener balance' });
    }
  },

  listarMovimientos: async function (req: Request, res: Response) {
    try {
      const movimientos = await MovimientoCaja.findAll({
        order: [['fecha', 'DESC']],
      });
      res.json(movimientos);
    } catch (error) {
      console.error('Error listando movimientos:', error);
      res.status(500).json({ error: 'Error al listar movimientos' });
    }
  },
  eliminarMovimiento: async function (req: Request, res: Response) {
    const { id } = req.params;

    try {
      const movimiento = await MovimientoCaja.findByPk(id);

      if (!movimiento) {
        return res.status(404).json({ error: "Movimiento no encontrado" });
      }

      await movimiento.destroy();

      return res.status(200).json({ message: "Movimiento eliminado correctamente" });
    } catch (error) {
      console.error("Error eliminando movimiento:", error);
      return res.status(500).json({ error: "Error interno del servidor" });
    }
  },
};
