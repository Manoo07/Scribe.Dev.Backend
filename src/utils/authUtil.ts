import crypto from "crypto";
import bcrypt from "bcrypt";

export function generateResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hashed = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hashed };
}

export async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}
