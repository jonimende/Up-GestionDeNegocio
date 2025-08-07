import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '../db'; // asumo que este es tu archivo de conexión

interface MovimientoCajaAttributes {
  id: number;
  tipoMovimiento: 'gasto' | 'retiro';
  monto: number;
  metodoPago: string;
  descripcion?: string | null;
  fecha: Date;
  usuarioId?: number | null;
  createdAt?: Date;
  updatedAt?: Date;
}

interface MovimientoCajaCreationAttributes extends Optional<MovimientoCajaAttributes, 'id' | 'descripcion' | 'usuarioId' | 'createdAt' | 'updatedAt'> {}

export class MovimientoCaja extends Model<MovimientoCajaAttributes, MovimientoCajaCreationAttributes> implements MovimientoCajaAttributes {
  public id!: number;
  public tipoMovimiento!: 'gasto' | 'retiro';
  public monto!: number;
  public metodoPago!: string;
  public descripcion!: string | null;
  public fecha!: Date;
  public usuarioId!: number | null;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

MovimientoCaja.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    tipoMovimiento: {
      type: DataTypes.ENUM('gasto', 'retiro'),
      allowNull: false,
      field: 'tipomovimiento',
    },
    monto: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    metodoPago: {
      type: DataTypes.STRING,
      allowNull: false,
      field: 'metodopago',
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    usuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      field: 'usuarioid',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'createdat',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'updatedat',
    },
  },
  {
    sequelize,
    tableName: 'MovimientosCaja',
    timestamps: true,
  }
);
