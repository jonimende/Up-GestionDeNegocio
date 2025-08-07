import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

export class Accesorios extends Model {
  public id!: number;
  public nombre!: string;
  public stock!: number | null;
  public precio!: number;
  public vendido!: boolean;
}

Accesorios.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "id", // campo real en la base
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "nombre", // campo real en la base
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "precio",
    },
    stock: {
      type: DataTypes.INTEGER,
     allowNull: false,
      defaultValue: 0,
      field: "stock",
    },
    vendido: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Accesorios",
    tableName: "accesorios", // tabla en minúscula
    timestamps: false,
  }
);
