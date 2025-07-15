import { DataTypes, Model } from "sequelize";
import  sequelize  from "../db";
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
  public valorFinal!: number | null;
  public ganancia!: number | null;
  public idProveedor!: number;
  public fechaIngreso!: Date;
  public fechaVenta!: Date | null;
  public comprador!: string | null;
}

Celular.init(
  {
    modelo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    almacenamiento: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bateria: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    precio: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    costo: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    idReparacion: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    valorReparacion: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    valorFinal: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    ganancia: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    idProveedor: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaIngreso: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fechaVenta: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    comprador: {
      type: DataTypes.STRING,
      allowNull: true,
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
