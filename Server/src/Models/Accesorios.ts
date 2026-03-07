import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";

export class Accesorios extends Model {
  public id!: number;
  public nombre!: string;
  public stock!: number;
  public precio!: number; // Precio de venta
  public precio_costo!: number; // Nuevo campo
  public vendido!: boolean;
}

Accesorios.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "id",
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "nombre",
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "precio",
    },
    precio_costo: { // Definición del nuevo campo
      type: DataTypes.FLOAT,
      allowNull: false, // O true, si querés permitir que algunos no lo tengan al principio
      field: "precio_costo",
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
    tableName: "accesorios",
    timestamps: false,
  }
);