import { Router } from "express";
import { proveedoresController } from "../Controllers/proveedorController";
import { authenticateToken } from "../Middlewares/authMiddlewares";

const router = Router();

// Obtener todos los proveedores
router.get("/", authenticateToken, async (req, res, next) => {
  await proveedoresController.getAll(req, res, next);
});

// Crear proveedor
router.post("/", authenticateToken, async (req, res, next) => {
  await proveedoresController.create(req, res, next);
});

// Eliminar proveedor
router.delete("/:id", authenticateToken, async (req, res, next) => {
  await proveedoresController.delete(req, res, next);
});

export default router;
