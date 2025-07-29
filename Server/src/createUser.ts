// scripts/createUser.ts
import bcrypt from "bcrypt";
import { Usuario } from "./Models/Usuario"; // Ajustá el path si es distinto
import  sequelize  from "./db"; // Ajustá según tu setup

async function crearUsuario() {
  try {
    await sequelize.authenticate();

    const nombre = "ariel";
    const passwordPlano = "arielAdmin";
    const passwordHasheada = await bcrypt.hash(passwordPlano, 10);

    const usuario = await Usuario.create({
      nombre,
      password: passwordHasheada,
      admin:true,
    });

    console.log("✅ Usuario creado con éxito:", usuario.toJSON());
  } catch (error) {
    console.error("❌ Error al crear usuario:", error);
  } finally {
    await sequelize.close();
  }
}

crearUsuario();
