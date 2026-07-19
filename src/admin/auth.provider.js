import User from "../models/User.js";

export async function authenticate(email, password) {
  if (!email || !password) return null;
  const user = await User.findOne({
    where: { email: email.trim().toLowerCase(), active: true },
  });
  if (!user || !(await user.verifyPassword(password))) return null;
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}
