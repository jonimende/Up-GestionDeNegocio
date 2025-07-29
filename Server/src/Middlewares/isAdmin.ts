import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

interface CustomJwtPayload extends JwtPayload {
  id: number;
  nombre: string;
  admin: boolean;
}

export const isAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "Token requerido" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "default_secret", (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Token no válido o expirado" });
    }

    if (
      typeof decoded === "object" &&
      decoded !== null &&
      "admin" in decoded &&
      (decoded as CustomJwtPayload).admin === true
    ) {
      next();
    } else {
      return res.status(403).json({ error: "Acceso restringido a administradores" });
    }
  });
};
