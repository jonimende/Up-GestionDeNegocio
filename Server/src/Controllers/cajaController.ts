import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Venta } from '../Models/Ventas';
import { MovimientoCaja } from '../Models/MovimientoCaja';
import { Celular } from '../Models/Celulares';     // Asegurate de que la ruta sea correcta
import { Accesorios } from '../Models/Accesorios'; // Asegurate de que la ruta sea correcta

export const cajaController = {
  obtenerCaja: async function (req: Request, res: Response) {
    try {
      const tipo = req.query.tipo as string;
      const metodoPago = req.query.metodoPago as string;
      const fechaParam = req.query.fecha as string; // Ej: "2026-03-11"

      let inicio: Date;
      let fin: Date;

      // 1. LÓGICA DE FECHAS (Diaria por fecha específica o mensual)
      if (tipo === 'mensual') {
        const ahora = new Date();
        inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
        fin = new Date(ahora.getFullYear(), ahora.getMonth() + 1, 0, 23, 59, 59, 999);
      } else {
        // Lógica Diaria
        if (fechaParam) {
          const parts = fechaParam.split('-');
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1; // Los meses en JS van de 0 a 11
          const day = parseInt(parts[2], 10);
          inicio = new Date(year, month, day, 0, 0, 0, 0);
          fin = new Date(year, month, day, 23, 59, 59, 999);
        } else {
          // Si no mandan fecha, por defecto es "hoy"
          const ahora = new Date();
          inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 0, 0, 0, 0);
          fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);
        }
      }

      const whereBase: WhereOptions = {
        fecha: { [Op.between]: [inicio, fin] },
      };

      if (metodoPago && metodoPago !== 'Todos') {
        whereBase['metodoPago'] = metodoPago;
      }

      // 2. TRAER VENTAS CON SUS RELACIONES (Para calcular costos)
      const ventas = await Venta.findAll({ 
        where: whereBase,
        include: [
          { model: Celular, attributes: ['costo'] },
          { 
            model: Accesorios, 
            as: 'accesorios', 
            attributes: ['precio_costo'],
            through: { attributes: ["cantidad"] } 
          }
        ]
      });

      let totalGeneral = 0;
      let cantidadGeneral = 0;
      let totalCosto = 0; // Para la ganancia

      let totalCelulares = 0;
      let cantidadCelulares = 0;

      let totalAccesorios = 0;
      let cantidadAccesorios = 0;

      ventas.forEach((venta: any) => {
        const monto = parseFloat(venta.total.toString());
        const cant = venta.cantidad;
        const tieneCelular = !!venta.celularId;
        const tieneAccesorio = !!venta.accesorioId || (venta.accesorios && venta.accesorios.length > 0);

        totalGeneral += monto;
        cantidadGeneral += cant;

        // Sumar costos de celulares
        if (venta.Celular && venta.Celular.costo) {
          totalCosto += parseFloat(venta.Celular.costo.toString()) * cant;
        }

        // Sumar costos de accesorios
        if (venta.accesorios && venta.accesorios.length > 0) {
          venta.accesorios.forEach((acc: any) => {
            const cantidadAcc = acc.VentaAccesorio.cantidad;
            const costoAcc = acc.precio_costo ? parseFloat(acc.precio_costo.toString()) : 0;
            totalCosto += (costoAcc * cantidadAcc);
          });
        }

        // Clasificación para el resumen
        if (tieneCelular && !tieneAccesorio) {
          totalCelulares += monto;
          cantidadCelulares += cant;
        } else if (!tieneCelular && tieneAccesorio) {
          totalAccesorios += monto;
          cantidadAccesorios += cant;
        } else if (tieneCelular && tieneAccesorio) {
          totalCelulares += monto;
          cantidadCelulares += cant;
        }
      });

      // 3. MOVIMIENTOS (Gastos, Retiros e INGRESOS iniciales)
      const movimientos = await MovimientoCaja.findAll({
        where: {
          fecha: { [Op.between]: [inicio, fin] },
          ...(metodoPago && metodoPago !== 'Todos' ? { metodoPago } : {}),
        },
        order: [['fecha', 'DESC']],
      });

      let totalEgresos = 0;
      let totalIngresosCaja = 0;

      movimientos.forEach((mov: any) => {
        const m = parseFloat(mov.monto.toString());
        if (mov.tipoMovimiento === 'ingreso') {
          totalIngresosCaja += m;
        } else {
          totalEgresos += m; // Gastos y retiros
        }
      });

      // 4. CÁLCULOS FINALES
      const ganancia = totalGeneral - totalCosto;
      // El total neto físico = lo que se vendió + plata que se puso en caja - plata que se sacó
      const totalNeto = totalGeneral + totalIngresosCaja - totalEgresos; 
      const balance = totalNeto;

      res.json({
        total: totalGeneral,
        cantidad: cantidadGeneral,
        metodoPago: metodoPago || 'Todos',
        totalNeto,
        balance,
        ganancia, // Nuevo campo enviado al front
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

      // Agregamos "ingreso" a los tipos válidos
      if (!['gasto', 'retiro', 'ingreso'].includes(tipoMovimiento)) {
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
      const totalIngresosVentas = (await Venta.sum('total')) || 0;
      
      // Sumamos también los movimientos tipo "ingreso"
      const movimientosIngreso = await MovimientoCaja.sum('monto', { where: { tipoMovimiento: 'ingreso' } }) || 0;
      
      const totalEgresosGastos = await MovimientoCaja.sum('monto', { where: { tipoMovimiento: ['gasto', 'retiro'] } }) || 0;

      const totalIngresos = totalIngresosVentas + movimientosIngreso;
      const balance = totalIngresos - totalEgresosGastos;

      res.json({ balance, totalIngresos, totalEgresos: totalEgresosGastos });
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