import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

export class Reward extends Model {}
Reward.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(160), allowNull: false },
  kind: { type: DataTypes.ENUM("LINK", "FILE", "COUPON", "CREDIT", "MANUAL"), allowNull: false },
  value: DataTypes.STRING(255),
  active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { sequelize, modelName: "Reward", tableName: "rewards" });
export default Reward;
