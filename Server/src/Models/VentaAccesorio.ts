import { DataTypes, Model } from "sequelize";
import { sequelize } from "../db";
import { Venta } from "./Ventas";
import { Accesorios } from "./Accesorios";

export class VentaAccesorio extends Model {
  public id!: number;
  public ventaId!: number;
  public accesorioId!: number;
  public cantidad!: number;
}

VentaAccesorio.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    ventaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    accesorioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
  },
  {
    sequelize,
    modelName: "VentaAccesorio",
    tableName: "venta_accesorios",
    timestamps: false,
  }
);

// Relaciones
Venta.belongsToMany(Accesorios, {
  through: VentaAccesorio,
  foreignKey: "ventaId",
  otherKey: "accesorioId",
  as: "accesorios",
});

Accesorios.belongsToMany(Venta, {
  through: VentaAccesorio,
  foreignKey: "accesorioId",
  otherKey: "ventaId",
});
