import { Router } from "express";
import { proveedoresController } from "../Controllers/proveedorController";

const router = Router();

router.get("/", proveedoresController.getAll);
router.post("/", proveedoresController.create);

export default router;
