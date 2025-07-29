import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.header('Authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'Acceso no autorizado, token requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default_secret', (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Token no válido o expirado' });
    }
    // Aquí asumo que el payload del token tiene las propiedades id, nombre, email, admin
    req.user = decoded as {
      id: number;
      nombre: string;
      admin: boolean;
    };
    next();
  });
};
