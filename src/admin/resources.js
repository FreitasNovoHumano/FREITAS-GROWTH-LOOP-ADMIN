import { Campaign, Lead, Referral, Reward, User } from "../models/index.js";
import { USER_ROLES } from "../models/User.js";
import { hashPassword } from "../services/password.service.js";

const isAdmin = ({ currentAdmin }) => currentAdmin?.role === USER_ROLES.ADMIN;
const isAuthenticated = ({ currentAdmin }) => Boolean(currentAdmin);

async function passwordHook(request) {
  if (request.method !== "post") return request;
  const password = request.payload?.password;
  if (password) request.payload.passwordHash = await hashPassword(password);
  delete request.payload.password;
  return request;
}

async function newUserHook(request) {
  if (request.method === "post" && !request.payload?.password) {
    throw new Error("A senha e obrigatoria.");
  }
  return passwordHook(request);
}

export const resources = [
  {
    resource: User,
    options: {
      navigation: { name: "Administracao", icon: "User" },
      listProperties: ["id", "name", "email", "role", "active", "createdAt"],
      editProperties: ["name", "email", "password", "role", "active"],
      properties: {
        email: { isTitle: true },
        passwordHash: { isVisible: false },
        password: { type: "password", isVisible: { list: false, filter: false, show: false, edit: true } },
        role: { availableValues: [
          { value: USER_ROLES.ADMIN, label: "Administrador" },
          { value: USER_ROLES.EDITOR, label: "Editor" },
        ] },
      },
      actions: {
        list: { isAccessible: isAuthenticated },
        show: { isAccessible: isAuthenticated },
        new: { isAccessible: isAdmin, before: newUserHook },
        edit: { isAccessible: isAdmin, before: passwordHook },
        delete: { isAccessible: isAdmin },
        bulkDelete: { isAccessible: false },
      },
    },
  },
  Campaign,
  Lead,
  Referral,
  Reward,
];
