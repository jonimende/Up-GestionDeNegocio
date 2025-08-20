import { Request, Response, NextFunction } from "express";
import { Proveedor } from "../Models/Proveedores";

export const proveedoresController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const proveedores = await Proveedor.findAll();
      res.json(proveedores);
    } catch (error) {
      console.error("Error en getAll proveedores:", error);
      next(error); // 🔹 delega al middleware de errores
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { nombre } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }

      const nuevoProveedor = await Proveedor.create({ nombre: nombre.trim() });
      res.status(201).json(nuevoProveedor);
    } catch (error) {
      console.error("Error en create proveedor:", error);
      next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const proveedor = await Proveedor.findByPk(id);

      if (!proveedor) {
        return res.status(404).json({ message: "Proveedor no encontrado" });
      }

      await proveedor.destroy();
      res.status(200).json({ message: "Proveedor eliminado correctamente" });
    } catch (error) {
      console.error("Error en delete proveedor:", error);
      next(error);
    }
  },
};
