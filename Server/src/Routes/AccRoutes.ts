// routes/accesorios.ts
import { Router } from "express";
import { Accesorios } from "../Models/Accesorios";

const router = Router();

// GET - obtener todos los accesorios
router.get("/", async (req, res) => {
  try {
    const accesorios = await Accesorios.findAll();
    res.json(accesorios);
  } catch (error) {
    console.error("Error en GET /accesorios:", error);
    res.status(500).json({ message: "Error al obtener accesorios" });
  }
});

// GET - obtener un accesorio por ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accesorio = await Accesorios.findByPk(id);
    if (!accesorio) {
      return res.status(404).json({ message: "Accesorio no encontrado" });
    }
    res.json(accesorio);
  } catch (error) {
    console.error("Error en GET /accesorios/:id:", error);
    res.status(500).json({ message: "Error al obtener accesorio" });
  }
});

// POST - crear un nuevo accesorio
router.post("/", async (req, res) => {
  try {
    const { nombre, stock } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: "El nombre es obligatorio" });
    }

    const nuevoAccesorio = await Accesorios.create({
      nombre,
      stock: stock ?? 0,
    });

    res.status(201).json(nuevoAccesorio);
  } catch (error) {
    console.error("Error en POST /accesorios:", error);
    res.status(500).json({ message: "Error al crear accesorio" });
  }
});

// PUT - actualizar un accesorio por ID
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accesorio = await Accesorios.findByPk(id);

    if (!accesorio) {
      return res.status(404).json({ message: "Accesorio no encontrado" });
    }

    const { nombre, stock } = req.body;

    await accesorio.update({
      nombre: nombre ?? accesorio.nombre,
      stock: stock ?? accesorio.stock,
    });

    res.json(accesorio);
  } catch (error) {
    console.error("Error en PUT /accesorios/:id:", error);
    res.status(500).json({ message: "Error al actualizar accesorio" });
  }
});

// DELETE - eliminar un accesorio por ID
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const accesorio = await Accesorios.findByPk(id);

    if (!accesorio) {
      return res.status(404).json({ message: "Accesorio no encontrado" });
    }

    await accesorio.destroy();
    res.json({ message: "Accesorio eliminado correctamente" });
  } catch (error) {
    console.error("Error en DELETE /accesorios/:id:", error);
    res.status(500).json({ message: "Error al eliminar accesorio" });
  }
});

export default router;
