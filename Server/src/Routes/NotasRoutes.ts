import { Router } from "express";
import { getNotas, crearNota, eliminarNota } from "../Controllers/NotasController";
import { authenticateToken } from "../Middlewares/authMiddlewares";

const router = Router();

router.get("/", getNotas);
router.post("/", crearNota);
router.delete("/:id", eliminarNota);

export default router;
