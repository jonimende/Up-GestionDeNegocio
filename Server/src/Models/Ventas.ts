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
    allowNull: true, // Campo opcional
  },
  accesorioId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Campo opcional
  },
  reparacionId: {
  type: DataTypes.INTEGER,
  allowNull: true,
  },
}, {
  sequelize,
  modelName: 'venta',
  tableName: 'ventas',
  timestamps: false
});

// Relaciones (sin allowNull)
Venta.belongsTo(Reparacion, { foreignKey: 'reparacionId' });
Reparacion.hasMany(Venta, { foreignKey: 'reparacionId' });

Venta.belongsTo(Celular, { foreignKey: 'celularId' });
Venta.belongsTo(Accesorios, { foreignKey: 'accesorioId' });

Celular.hasMany(Venta, { foreignKey: 'celularId' });
Accesorios.hasMany(Venta, { foreignKey: 'accesorioId' });
