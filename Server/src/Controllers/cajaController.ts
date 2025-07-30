import { Request, Response } from 'express';
import { Op, WhereOptions } from 'sequelize';
import { Venta } from '../Models/Ventas';

export const obtenerCaja = async (req: Request, res: Response) => {
  try {
    const tipo = req.query.tipo as string;
    const metodoPago = req.query.metodoPago as string;

    const ahora = new Date();
    const inicio = new Date();

    if (tipo === 'diaria') {
      inicio.setHours(0, 0, 0, 0);
    } else if (tipo === 'mensual') {
      inicio.setDate(1);
      inicio.setHours(0, 0, 0, 0);
    } else {
      return res.status(400).json({ error: 'Tipo inválido' });
    }

    const where: WhereOptions = {
      fecha: { [Op.gte]: inicio, [Op.lte]: ahora },
    };

    if (metodoPago && metodoPago !== 'Todos') {
      where.metodoPago = metodoPago;  // usar camelCase aquí
    }

    const ventas = await Venta.findAll({ where });

    const total = ventas.reduce((acc, venta) => acc + Number(venta.total), 0);
    const cantidad = ventas.length;

    res.json({ total, cantidad, metodoPago: metodoPago || 'Todos' });
  } catch (err) {
    res.status(500).json({ error: 'Error al calcular la caja', detalle: err });
  }
};
