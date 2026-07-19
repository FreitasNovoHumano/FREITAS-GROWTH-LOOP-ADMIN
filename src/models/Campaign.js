import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

export class Campaign extends Model {}
Campaign.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: { type: DataTypes.STRING(160), allowNull: false },
  slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
  description: DataTypes.TEXT,
  status: { type: DataTypes.ENUM("DRAFT", "ACTIVE", "PAUSED", "ENDED"), defaultValue: "DRAFT" },
  startsAt: DataTypes.DATE,
  endsAt: DataTypes.DATE,
}, { sequelize, modelName: "Campaign", tableName: "campaigns" });
export default Campaign;
