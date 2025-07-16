import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

export class Accesorios extends Model {
  public id!: number;
  public nombre!: string;
}

Accesorios.init(
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Accesorios",
    tableName: "Accesorios",
    timestamps: false,
  }
);
