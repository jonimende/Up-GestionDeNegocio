import express from 'express';
import sequelize from './db';
import cors from "cors";
import authRoutes from './Routes/authRoutes'
import { Request, Response, NextFunction } from 'express';


const app = express();
app.use(cors({
  origin: "http://localhost:3000", // URL donde corre tu React
  credentials: true, // si usás cookies o auth
}));

app.use('/auth', authRoutes);

// Manejo de errores global
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
    console.log('Conectado a la base de datos PostgreSQL');
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('No se pudo conectar a la base de datos:', error);
  }
}

startServer();
