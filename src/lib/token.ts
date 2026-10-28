import { SignJWT, jwtVerify } from "jose";
import type { UserRole } from "@prisma/client";

export const SESSION_HOURS = 8;

export type SessionData = {
  userId: string;
  name: string;
  role: UserRole;
};

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set in .env");
  return new TextEncoder().encode(secret);
}

export async function signToken(data: SessionData) {
  return new SignJWT({ ...data })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      name: payload.name as string,
      role: payload.role as UserRole,
    };
  } catch {
    return null; // expired, tampered with, or invalid
  }
}