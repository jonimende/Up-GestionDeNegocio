// routes/celulares.ts
import { Router } from "express";
import { Celular } from "../Models/Celulares";

const router = Router();

// GET - obtener todos los celulares
router.get("/", async (req, res) => {
  try {
    const celulares = await Celular.findAll();
    res.json(celulares);
  } catch (error) {
    console.error("Error en GET /celulares:", error);
    res.status(500).json({ message: "Error al obtener celulares" });
  }
});

// GET - obtener un celular por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const celular = await Celular.findByPk(id);
    if (!celular) {
      return res.status(404).json({ message: "Celular no encontrado" });
    }
    res.json(celular);
  } catch (error) {
    console.error("Error en GET /celulares/:id:", error);
    res.status(500).json({ message: "Error al obtener celular" });
  }
});

// POST - crear un nuevo celular
router.post("/", async (req, res) => {
  try {
    const {
      modelo,
      almacenamiento,
      bateria,
      color,
      precio,
      observaciones,
      costo,
      idReparacion,
      valorFinal,
      ganancia,
      idProveedor,
      fechaIngreso,
      fechaVenta,
      comprador,
      stock,
    } = req.body;

    // Validación básica (podés agregar express-validator más adelante)
    if (
      !modelo ||
      !almacenamiento ||
      !bateria ||
      !color ||
      precio == null ||
      costo == null ||
      !idProveedor ||
      !fechaIngreso
    ) {
      return res.status(400).json({ message: "Faltan datos obligatorios" });
    }

    const nuevoCelular = await Celular.create({
      modelo,
      almacenamiento,
      bateria,
      color,
      precio,
      observaciones: observaciones || null,
      costo,
      idReparacion: idReparacion || null,
      valorFinal: valorFinal || null,
      ganancia: ganancia || null,
      idProveedor,
      fechaIngreso,
      fechaVenta: fechaVenta || null,
      comprador: comprador || null,
      stock: stock ?? 0,
    });

    res.status(201).json(nuevoCelular);
  } catch (error) {
    console.error("Error en POST /celulares:", error);
    res.status(500).json({ message: "Error al crear celular" });
  }
});

// PUT - actualizar un celular por ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const celular = await Celular.findByPk(id);

    if (!celular) {
      return res.status(404).json({ message: "Celular no encontrado" });
    }

    const {
      modelo,
      almacenamiento,
      bateria,
      color,
      precio,
      observaciones,
      costo,
      idReparacion,
      valorFinal,
      ganancia,
      idProveedor,
      fechaIngreso,
      fechaVenta,
      comprador,
      stock,
    } = req.body;

    await celular.update({
      modelo: modelo ?? celular.modelo,
      almacenamiento: almacenamiento ?? celular.almacenamiento,
      bateria: bateria ?? celular.bateria,
      color: color ?? celular.color,
      precio: precio ?? celular.precio,
      observaciones: observaciones ?? celular.observaciones,
      costo: costo ?? celular.costo,
      idReparacion: idReparacion ?? celular.idReparacion,
      valorFinal: valorFinal ?? celular.valorFinal,
      ganancia: ganancia ?? celular.ganancia,
      idProveedor: idProveedor ?? celular.idProveedor,
      fechaIngreso: fechaIngreso ?? celular.fechaIngreso,
      fechaVenta: fechaVenta ?? celular.fechaVenta,
      comprador: comprador ?? celular.comprador,
      stock: stock ?? celular.stock,
    });

    res.json(celular);
  } catch (error) {
    console.error("Error en PUT /celulares/:id:", error);
    res.status(500).json({ message: "Error al actualizar celular" });
  }
});

// DELETE - eliminar un celular por ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const celular = await Celular.findByPk(id);

    if (!celular) {
      return res.status(404).json({ message: "Celular no encontrado" });
    }

    await celular.destroy();
    res.json({ message: "Celular eliminado correctamente" });
  } catch (error) {
    console.error("Error en DELETE /celulares/:id:", error);
    res.status(500).json({ message: "Error al eliminar celular" });
  }
});

export default router;
