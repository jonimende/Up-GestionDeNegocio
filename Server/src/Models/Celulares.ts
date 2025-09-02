import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";
import { Reparacion } from "./Reparaciones";
import { Proveedor } from "./Proveedores";

export class Celular extends Model {
  public id!: number;
  public modelo!: string;
  public almacenamiento!: string;
  public bateria!: string;
  public color!: string;
  public precio!: number;
  public observaciones!: string | null;
  public costo!: number;
  public idReparacion!: number | null;
  public valorReparacion!: number | null;
  public valorFinal!: number | null;
  public imei!: string | null;
  public ganancia!: number | null;
  public idProveedor!: number;
  public fechaIngreso!: Date;
  public fechaVenta!: Date | null;
  public comprador!: string | null;
  public stock!: number;
  public vendido!: boolean;
}

Celular.init(
  {
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "modelo",
    },
    almacenamiento: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "almacenamiento",
    },
    bateria: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "bateria",
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "color",
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "precio",
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "observaciones",
    },
    costo: {
      type: DataTypes.FLOAT,
      allowNull: false,
      field: "costo",
    },
    idReparacion: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "idreparacion",  // minúscula en la BD
    },
    valorFinal: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "valorfinal", // minúscula en la BD
    },
    imei:{
      type: DataTypes.STRING,
      allowNull: true,
      field: "imei",
    },
    ganancia: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "ganancia",
    },
    idProveedor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "idproveedor", // minúscula en la BD
    },
    fechaIngreso: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "fechaingreso", // minúscula en la BD
    },
    fechaVenta: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "fechaventa", // minúscula en la BD
    },
    comprador: {
      type: DataTypes.STRING,
      allowNull: true,
      field: "comprador",
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
    modelName: "Celular",
    tableName: "celulares",
    timestamps: false,
  }
);

// Relaciones
Celular.belongsTo(Reparacion, {
  foreignKey: "idReparacion",
  as: "reparacion",
});

Celular.belongsTo(Proveedor, {
  foreignKey: "idProveedor",
  as: "proveedor",
});
