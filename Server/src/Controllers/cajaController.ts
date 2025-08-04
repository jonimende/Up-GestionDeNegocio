import { Request, Response } from 'express';
import { Op, WhereOptions, fn, col } from 'sequelize';
import { Venta } from '../Models/Ventas';

export const obtenerCaja = async (req: Request, res: Response) => {
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
      // mensual
      inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1, 0, 0, 0, 0);
    }

    // Armo el filtro where
    const where: WhereOptions = {
      fecha: { [Op.between]: [inicio, ahora] },
    };

    if (metodoPago && metodoPago !== 'Todos') {
      // Campo método de pago según tu modelo (camelCase)
      where.metodoPago = metodoPago;
    }

    // Consulta agregada: suma total y cuenta cantidad de ventas en el rango
    const totalVentas = await Venta.sum('total', { where }) as number | null;
    const cantidadVentas = await Venta.count({ where });

    // Si suma da null (no hay ventas), lo manejo como 0
    const total = totalVentas ?? 0;
    const cantidad = cantidadVentas;

    res.json({ total, cantidad, metodoPago: metodoPago || 'Todos' });
  } catch (err) {
    console.error('Error en obtenerCaja:', err);
    res.status(500).json({ error: 'Error al calcular la caja', detalle: err });
  }
};
