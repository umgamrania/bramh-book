"use server";

import crypto from "crypto";
import { cookies } from "next/headers";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.DATABASE_URL ||
  "default-session-secret-key-32-chars-long!!!";
const ALGORITHM = "aes-256-cbc";
const KEY = crypto.createHash("sha256").update(SESSION_SECRET).digest();

function encryptSession(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decryptSession(text: string): string {
  try {
    const [ivHex, encryptedText] = text.split(":");
    if (!ivHex || !encryptedText) return "";
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedText, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (error) {
    return "";
  }
}

export async function loginAdmin(password: string) {
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
  if (password === adminPassword) {
    // Generate session token valid for 24 hours
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    const token = encryptSession(`${expiresAt}`);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set("admin_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: new Date(expiresAt),
      path: "/",
    });
    return { success: true };
  }
  return { success: false, error: "Invalid password" };
}

export async function logoutAdmin() {
  const cookieStore = await cookies();
  cookieStore.delete("admin_session");
  return { success: true };
}

export async function verifySession(token: string): Promise<boolean> {
  if (!token) return false;
  const decrypted = decryptSession(token);
  if (!decrypted) return false;
  const expiresAt = parseInt(decrypted, 10);
  if (isNaN(expiresAt) || Date.now() > expiresAt) {
    return false;
  }
  return true;
}
