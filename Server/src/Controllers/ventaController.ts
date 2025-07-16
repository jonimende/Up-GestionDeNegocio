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
        celular,    // objeto con datos del celular o null
        accesorio,  // objeto con datos del accesorio o null
        reparacion, // objeto con datos de reparación o null
      } = req.body;

      // Validación mínima
      if (!cantidad || !total) {
        return res.status(400).json({ error: 'Cantidad y total son requeridos' });
      }

      // Función auxiliar para crear o buscar el celular
      async function findOrCreateCelular(celularData: any) {
        if (!celularData) return null;
        let cel = null;
        if (celularData.id) {
          cel = await Celular.findByPk(celularData.id);
        }
        if (!cel) {
          cel = await Celular.create(celularData);
        }
        return cel;
      }

      // Función auxiliar para crear o buscar accesorio
      async function findOrCreateAccesorio(accesorioData: any) {
        if (!accesorioData) return null;
        let acc = null;
        if (accesorioData.id) {
          acc = await Accesorios.findByPk(accesorioData.id);
        }
        if (!acc) {
          acc = await Accesorios.create(accesorioData);
        }
        return acc;
      }

      // Función auxiliar para crear o buscar reparación
      async function findOrCreateReparacion(reparacionData: any) {
        if (!reparacionData) return null;
        let rep = null;
        if (reparacionData.id) {
          rep = await Reparacion.findByPk(reparacionData.id);
        }
        if (!rep) {
          rep = await Reparacion.create(reparacionData);
        }
        return rep;
      }

      const cel = await findOrCreateCelular(celular);
      const acc = await findOrCreateAccesorio(accesorio);
      const rep = await findOrCreateReparacion(reparacion);

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
      next(error);
    }
  }
};
