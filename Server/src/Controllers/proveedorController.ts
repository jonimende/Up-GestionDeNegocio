import { Request, Response } from "express";
import { Proveedor } from "../Models/Proveedores";

export const proveedoresController = {
  getAll: async (req: Request, res: Response) => {
    try {
      const proveedores = await Proveedor.findAll();
      res.json(proveedores);
    } catch (error) {
      console.error("Error en getAll proveedores:", error);
      res.status(500).json({ message: "Error al obtener proveedores" });
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const { nombre } = req.body;

      if (!nombre || !nombre.trim()) {
        return res.status(400).json({ message: "El nombre es obligatorio" });
      }

      const nuevoProveedor = await Proveedor.create({ nombre: nombre.trim() });
      res.status(201).json(nuevoProveedor);
    } catch (error) {
      console.error("Error en create proveedor:", error);
      res.status(500).json({ message: "Error al crear proveedor" });
    }
  },
};
