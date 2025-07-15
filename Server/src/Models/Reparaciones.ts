import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

export class Reparacion extends Model {
  public id!: number;
  public descripcion!: string;       // qué se reparó
  public valor!: number;             // valor de la reparación
  public reparadoPor!: string;       // quién lo reparó
}

Reparacion.init(
  {
    descripcion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    valor: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    reparadoPor: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Reparacion",
    tableName: "reparaciones",
    timestamps: false,
  }
);
