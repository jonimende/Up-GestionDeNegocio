// models/Venta.ts
import { Model, DataTypes } from 'sequelize';
import sequelize from '../db';
import { Celular } from './Celulares';
import { Accesorios } from './Accesorios';
import { Reparacion } from './Reparaciones';

export class Venta extends Model {}

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
