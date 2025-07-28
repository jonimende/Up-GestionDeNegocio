import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

export class Reparacion extends Model {
  public id!: number;
  public descripcion!: string;
  public valor!: number;
  public reparadoPor!: string;
}

Reparacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "id",
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "descripcion",
    },
    valor: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "valor",
    },
    reparadoPor: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "reparadopor", // mapea a la columna exacta en la base
    },
  },
  {
    sequelize,
    modelName: "Reparacion",
    tableName: "reparaciones", // nombre de tabla real en minúscula
    timestamps: false,
  }
);
