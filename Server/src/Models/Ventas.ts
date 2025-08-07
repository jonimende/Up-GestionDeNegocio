import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db';
import { Celular } from './Celulares';
import { Accesorios } from './Accesorios';
import { Reparacion } from './Reparaciones';
import { Proveedor } from './Proveedores';

export type MetodoPago = 'Efectivo' | 'Transferencia';

interface VentaAttributes {
  id: number;
  cantidad: number;
  total: number;
  fecha?: Date;
  celularId?: number | null;
  accesorioId?: number | null;
  reparacionId?: number | null;
  metodoPago?: MetodoPago;
  descuento?: number | null;
  comprador?: string | null;
  ganancia?: number | null;
  idProveedor?: number | null;
}

interface VentaCreationAttributes extends Optional<VentaAttributes, 'id' | 'fecha'> {}

export class Venta extends Model<VentaAttributes, VentaCreationAttributes> implements VentaAttributes {
  public id!: number;
  public cantidad!: number;
  public total!: number;
  public fecha!: Date;
  public celularId!: number | null;
  public accesorioId!: number | null;
  public reparacionId!: number | null;
  public metodoPago!: MetodoPago;
  public descuento!: number | null;
  public comprador!: string | null;

  public ganancia!: number | null;
  public idProveedor!: number | null;
}

Venta.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  total: {
    type: DataTypes.DECIMAL,
    allowNull: false,
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  celularId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'celularid',
  },
  accesorioId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'accesorioid',
  },
  reparacionId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'reparacionid',
  },
  metodoPago: {
    type: DataTypes.ENUM('Efectivo', 'Transferencia'),
    allowNull: false,
    field: 'metodo_pago',
  },
  descuento: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  comprador: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  // NUEVOS CAMPOS
  ganancia: {
    type: DataTypes.DECIMAL,
    allowNull: true,
  },
  idProveedor: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'id_proveedor',
  },
}, {
  sequelize,
  modelName: 'Venta',
  tableName: 'ventas',
  timestamps: true,
});

// Relaciones
Venta.belongsTo(Reparacion, { foreignKey: 'reparacionId' });
Reparacion.hasMany(Venta, { foreignKey: 'reparacionId' });

Venta.belongsTo(Celular, { foreignKey: 'celularId' });
Celular.hasMany(Venta, { foreignKey: 'celularId' });

Venta.belongsTo(Accesorios, { foreignKey: 'accesorioId', as: 'Accesorio' });
Accesorios.hasMany(Venta, { foreignKey: 'accesorioId' });

Venta.belongsTo(Proveedor, { foreignKey: 'idProveedor' });
Proveedor.hasMany(Venta, { foreignKey: 'idProveedor' });
