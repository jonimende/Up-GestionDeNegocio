import { Request, Response } from "express";
import Nota from "../Models/Notas";

export const getNotas = async (req: Request, res: Response) => {
  try {
    const notas = await Nota.findAll({ order: [["createdAt", "DESC"]] });
    res.json(notas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener notas" });
  }
};

export const crearNota = async (req: Request, res: Response) => {
  try {
    const { contenido } = req.body;
    if (!contenido) return res.status(400).json({ message: "Contenido requerido" });

    const nuevaNota = await Nota.create({ contenido });
    res.status(201).json(nuevaNota);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al crear nota" });
  }
};

export const eliminarNota = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const nota = await Nota.findByPk(id);
    if (!nota) return res.status(404).json({ message: "Nota no encontrada" });

    await nota.destroy();
    res.json({ message: "Nota eliminada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al eliminar nota" });
  }
};
