
import { cookies } from "next/headers";
import {
  SESSION_HOURS,
  signToken,
  verifyToken,
  type SessionData,
} from "./token";

const COOKIE = "session";

export async function createSession(data: SessionData) {
  const token = await signToken(data);

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  });
}

export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;

  return token ? verifyToken(token) : null;
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}
