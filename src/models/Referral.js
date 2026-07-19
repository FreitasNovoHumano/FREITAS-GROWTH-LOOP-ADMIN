import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";

export class Referral extends Model {}
Referral.init({
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  referrerEmail: { type: DataTypes.STRING(180), allowNull: false },
  referredEmail: { type: DataTypes.STRING(180), allowNull: false },
  status: { type: DataTypes.ENUM("CLICKED", "REGISTERED", "QUALIFIED", "REJECTED"), defaultValue: "CLICKED" },
}, { sequelize, modelName: "Referral", tableName: "referrals" });
export default Referral;
