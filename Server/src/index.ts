import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import { sequelize } from './db';
import cors from "cors";
import authRoutes from './Routes/authRoutes';
import ventas from './Routes/ventaRoutes';
import celulares from './Routes/celularesRoutes';
import reparaciones from './Routes/reparacionesRoutes';
import accesorios from './Routes/AccRoutes';
import notaRoutes from './Routes/NotasRoutes';
import proveedoresRoutes from './Routes/ProovedoresRoutes';
import MovimientoCaja from './Routes/movimientosCajaRoutes';

const app = express();
app.use(cors({
  origin: ["https://up-gestion-de-negocio.vercel.app", "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/ventas', ventas);
app.use('/celulares', celulares);
app.use('/accesorios', accesorios);
app.use('/reparaciones', reparaciones);
app.use("/proveedores", proveedoresRoutes);
app.use('/notas', notaRoutes);
app.use('/caja', MovimientoCaja);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).json({
    message: "Ha ocurrido un error en el servidor",
    error: err.message,
  });
});

const PORT = process.env.PORT || 3001;

async function startServer() {
  let retries = 5;
  
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conectado a PostgreSQL');

      await sequelize.sync({ alter: true }); 
      console.log('✅ Tablas sincronizadas');

      console.log('👤 Usuarios seed creados');

      app.listen(PORT, () => {
        console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      });

      // Si todo sale bien, rompemos el bucle para que no siga reintentando
      break; 

    } catch (error) {
      console.log(`⏳ La base de datos no está lista. Reintentando en 5 segundos... (Quedan ${retries - 1} intentos)`);
      retries -= 1;
      
      if (retries === 0) {
        console.error('❌ No se pudo conectar a la base de datos después de varios intentos:', error);
        process.exit(1); // Le avisa a Railway que el proceso falló críticamente
      }
      
      // Espera 5 segundos antes del siguiente intento
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

startServer();
