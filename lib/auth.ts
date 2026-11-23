import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "default_secret_key_change_me");

export interface JWTPayload {
  userId: string;
  email: string;
}

/**
 * Membuat token JWT untuk sesi pengguna
 */
export async function signJWT(payload: JWTPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

/**
 * Verifikasi token JWT
 */
export async function verifyJWT(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/**
 * Mendapatkan pengguna aktif dari sesi cookie
 */
export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("taskflow_session")?.value;

  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  // Verifikasi ke database untuk memastikan user masih ada (anti-IDOR/Stale session)
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, name: true, email: true },
  });

  return user;
}

/**
 * Middleware server-side: wajibkan login, redirect ke /login jika tidak ada sesi
 */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}
