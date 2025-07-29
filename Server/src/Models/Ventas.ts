import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../db';
import { Celular } from './Celulares';
import { Accesorios } from './Accesorios';
import { Reparacion } from './Reparaciones';

export type MetodoPago = 'Efectivo' | 'Transferencia';
// Define los atributos del modelo Venta
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
  comprador?: string;
}

// Para creación, id y fecha pueden ser opcionales (ya que autoIncrement y defaultValue)
interface VentaCreationAttributes extends Optional<VentaAttributes, 'id' | 'fecha'> {}

// Extendemos Model con tipos de atributos
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
  public comprador!: string;
}

Venta.init({
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    field: 'id',
  },
  cantidad: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'cantidad',
  },
  total: {
    type: DataTypes.DECIMAL,
    allowNull: false,
    field: 'total',
  },
  fecha: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'fecha',
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
    field: 'descuento',
  },
  comprador: {
    type: DataTypes.STRING,
    allowNull: false,
    field: 'comprador',
  },
}, {
  sequelize,
  modelName: 'Venta',
  tableName: 'ventas',
  timestamps: false,
});

// Relaciones
Venta.belongsTo(Reparacion, { foreignKey: 'reparacionId' });
Reparacion.hasMany(Venta, { foreignKey: 'reparacionId' });

Venta.belongsTo(Celular, { foreignKey: 'celularId' });
Celular.hasMany(Venta, { foreignKey: 'celularId' });

Venta.belongsTo(Accesorios, { foreignKey: 'accesorioId' });
Accesorios.hasMany(Venta, { foreignKey: 'accesorioId' });
