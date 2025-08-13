import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { sequelize } from './db';
import cors from "cors";
import authRoutes from './Routes/authRoutes'
import { Request, Response, NextFunction } from 'express';
import ventas from './Routes/ventaRoutes'
import celulares from './Routes/celularesRoutes';
import reparaciones from './Routes/reparacionesRoutes';
import accesorios from './Routes/AccRoutes';
import notaRoutes from './Routes/NotasRoutes';
import  proveedoresRoutes  from './Routes/ProovedoresRoutes';
import MovimientoCaja from './Routes/movimientosCajaRoutes';

const app = express();
app.use(cors({
  origin: "https://up-gestion-de-negocio.vercel.app", // URL donde corre tu React
  credentials: true, // si usás cookies o auth
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
  res
    .status(500)
    .json({
      message: "Ha ocurrido un error en el servidor",
      error: err.message,
    });
});


const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conectado a la base de datos PostgreSQL');

    // Crear/sincronizar tablas
    await sequelize.sync({ alter: true }); 
    console.log('✅ Tablas sincronizadas');

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error);
  }
}


startServer();
