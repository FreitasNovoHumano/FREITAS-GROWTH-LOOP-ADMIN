import sequelize from "../config/database.js";
import User from "./User.js";
import Campaign from "./Campaign.js";
import Lead from "./Lead.js";
import Referral from "./Referral.js";
import Reward from "./Reward.js";

Campaign.hasMany(Lead, { foreignKey: "campaignId", as: "leads" });
Lead.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });
Campaign.hasMany(Referral, { foreignKey: "campaignId", as: "referrals" });
Referral.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });
Campaign.hasMany(Reward, { foreignKey: "campaignId", as: "rewards" });
Reward.belongsTo(Campaign, { foreignKey: "campaignId", as: "campaign" });

export { sequelize, User, Campaign, Lead, Referral, Reward };
export const models = { User, Campaign, Lead, Referral, Reward };
export async function syncModels() { await sequelize.sync(); }
