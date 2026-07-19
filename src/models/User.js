import { DataTypes, Model } from "sequelize";
import sequelize from "../config/database.js";
import { verifyPassword } from "../services/password.service.js";

export const USER_ROLES = Object.freeze({ ADMIN: "ADMIN", EDITOR: "EDITOR" });

export class User extends Model {
  verifyPassword(password) {
    return verifyPassword(password, this.passwordHash);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    delete values.passwordHash;
    return values;
  }
}

User.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(120), allowNull: false },
    email: {
      type: DataTypes.STRING(180), allowNull: false, unique: true,
      validate: { isEmail: true },
      set(value) { this.setDataValue("email", value?.trim().toLowerCase()); },
    },
    passwordHash: { type: DataTypes.STRING(255), allowNull: false },
    password: { type: DataTypes.VIRTUAL },
    role: {
      type: DataTypes.ENUM(...Object.values(USER_ROLES)),
      allowNull: false,
      defaultValue: USER_ROLES.EDITOR,
    },
    active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  { sequelize, modelName: "User", tableName: "admin_users" },
);

export default User;
