// routes/accesorios.ts
import { Router } from "express";
import { Accesorios } from "../Models/Accesorios";
import { authenticateToken } from "../Middlewares/authMiddlewares";
import { isAdmin } from "../Middlewares/isAdmin";

const router = Router();

// GET - obtener todos los accesorios
router.get("/",authenticateToken, async (req, res) => {
  try {
    const accesorios = await Accesorios.findAll();
    res.json(accesorios);
  } catch (error) {
    console.error("Error en GET /accesorios:", error);
    res.status(500).json({ message: "Error al obtener accesorios" });
  }
});

router.get("/disponibles", async (req, res) => {
  try {
    const disponibles = await Accesorios.findAll({
      where: { vendido: false },
    });
    res.json(disponibles);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener accesorios disponibles" });
  }
});
// GET - obtener un accesorio por ID
router.get("/:id",authenticateToken, async (req, res) => {
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
router.post("/", authenticateToken, async (req, res) => {
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
router.put("/:id",authenticateToken, isAdmin, async (req, res) => {
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
router.delete("/:id",authenticateToken, isAdmin, async (req, res) => {
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
