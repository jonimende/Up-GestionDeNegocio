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
        celular,    // puede ser null o {id, ...}
        accesorioId,  // puede ser null o number
        reparacionId, // puede ser null o number
      } = req.body;

      // Validación mínima
      if (!cantidad || !total) {
        return res.status(400).json({ error: 'Cantidad y total son requeridos' });
      }

      // Función auxiliar para crear o buscar el celular
      async function findOrCreateCelular(celularData: any) {
        if (!celularData || Object.keys(celularData).length === 0) return null;

        let cel = null;
        if (celularData.id) {
          cel = await Celular.findByPk(celularData.id);
        }
        if (!cel) {
          cel = await Celular.create(celularData);
        }
        return cel;
      }

      // Función auxiliar para buscar accesorio por id
      async function findAccesorioById(id: number | null) {
        if (!id) return null;
        return await Accesorios.findByPk(id);
      }

      // Función auxiliar para buscar reparación por id
      async function findReparacionById(id: number | null) {
        if (!id) return null;
        return await Reparacion.findByPk(id);
      }

      const cel = await findOrCreateCelular(celular);
      const acc = await findAccesorioById(accesorioId);
      const rep = await findReparacionById(reparacionId);

      const nuevaVenta = await Venta.create({
        cantidad,
        total,
        fecha: fecha || new Date(),
        celularId: cel ? cel.id : null,
        accesorioId: acc ? acc.id : null,
        reparacionId: rep ? rep.id : null,
      });

      res.status(201).json(nuevaVenta);
    } catch (error) {
      console.error('Error en createVenta:', error);
      next(error);
    }
  }
};
