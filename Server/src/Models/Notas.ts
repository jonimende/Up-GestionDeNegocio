import { DataTypes, Model } from 'sequelize';
import sequelize from '../db';

class Nota extends Model {
  public id!: number;
  public contenido!: string;
  public createdAt!: Date;
}

Nota.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contenido: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Nota',
    tableName: 'notas',
    timestamps: true,
  }
);

export default Nota;
