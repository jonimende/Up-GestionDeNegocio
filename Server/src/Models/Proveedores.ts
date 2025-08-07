import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

export class Proveedor extends Model {
  public id!: number;
  public nombre!: string;
}

Proveedor.init(
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Proveedor",
    tableName: "proveedores",
    timestamps: false,
  }
);
