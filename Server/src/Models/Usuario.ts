import { DataTypes, Model } from "sequelize";
import sequelize from "../db";

export class Usuario extends Model {
  public id!: number;
  public nombre!: string;
  public password!: string;
  public admin!: boolean;
}

Usuario.init(
  {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    admin: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Usuario",
    tableName: "usuarios",
    timestamps: false,
  }
);
