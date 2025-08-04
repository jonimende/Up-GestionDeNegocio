// routes/celulares.ts
import { Router } from "express";
import { Celular } from "../Models/Celulares";
import { Proveedor } from "../Models/Proveedores";
import { authenticateToken } from "../Middlewares/authMiddlewares";
import { isAdmin } from "../Middlewares/isAdmin";

const router = Router();

// GET - obtener todos los celulares
router.get("/", authenticateToken, async (req, res) => {
  try {
    const celulares = await Celular.findAll({
      include: [
        {
          model: Proveedor,
          as: "proveedor", // alias que tengas definido en el modelo
          attributes: ["id", "nombre"], // solo los campos necesarios
        },
      ],
    });
    res.json(celulares);
  } catch (error) {
    console.error("Error en GET /celulares:", error);
    res.status(500).json({ message: "Error al obtener celulares" });
  }
});

router.get("/disponibles",authenticateToken, async (req, res) => {
  try {
    const disponibles = await Celular.findAll({
      where: { vendido: false },
      include: [
        {
          model: Proveedor,
          as: 'proveedor',
          attributes: ["id", "nombre"],
        },
      ],
    });

    // Convertir a JSON y agregar proveedorId en cada celular
    const celularesConProveedorId = disponibles.map(celular => {
      const c = celular.toJSON();
      return {
        ...c,
        proveedorId: c.proveedor ? c.proveedor.id : null,
      };
    });

    res.json(celularesConProveedorId);
  } catch (error) {
    console.error("Error al obtener celulares disponibles:", error);
    res.status(500).json({ error: "Error al obtener celulares disponibles" });
  }
});


router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const celular = await Celular.findByPk(id, {
      include: [
        {
          model: Proveedor,
          as: "proveedor",
          attributes: ["id", "nombre"],
        },
      ],
    });
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
router.post("/", authenticateToken, async (req, res) => {
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
      imei, // <-- Agregado imei
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
      imei: imei || null, // <-- Guardar imei
    });

    res.status(201).json(nuevoCelular);
  } catch (error) {
    console.error("Error en POST /celulares:", error);
    res.status(500).json({ message: "Error al crear celular" });
  }
});

// PUT - actualizar un celular por ID
router.put("/:id", authenticateToken, isAdmin, async (req, res) => {
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
      imei, // <-- Agregado imei
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
      imei: imei ?? celular.imei, // <-- Actualizar imei
    });

    res.json(celular);
  } catch (error) {
    console.error("Error en PUT /celulares/:id:", error);
    res.status(500).json({ message: "Error al actualizar celular" });
  }
});

// DELETE - eliminar un celular por ID
router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
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
