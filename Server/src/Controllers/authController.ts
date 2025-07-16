import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Usuario } from '../Models/Usuario';
import dotenv from 'dotenv';

dotenv.config();

export const authController = {
 login : async (req: Request, res: Response, next: NextFunction) => {
  const { nombre, password } = req.body;

  if (!nombre || !password) {
    return res.status(400).json({ error: 'Nombre y contraseña requeridos' });
  }

  try {
    const usuario = await Usuario.findOne({ where: { nombre } });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }
    console.log('JWT_SECRET en login:', process.env.JWT_SECRET);

    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        admin: usuario.admin
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '3h' }
    );
    console.log('JWT_SECRET en login:', process.env.JWT_SECRET);

    res.status(200).json({ token });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
 }
}