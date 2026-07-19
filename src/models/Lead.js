import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

export class Lead extends Model {}
Lead.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  name: { type: DataTypes.STRING(160), allowNull: false },
  email: { type: DataTypes.STRING(180), allowNull: false, validate: { isEmail: true } },
  phone: DataTypes.STRING(40),
  source: { type: DataTypes.STRING(80), defaultValue: "referral" },
}, { sequelize, modelName: "Lead", tableName: "leads" });
export default Lead;
