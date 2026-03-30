import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE_NAME = "doll_admin_session";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function signSessionPayload(payload, secret) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function resolveAdminAuthConfig(env = process.env) {
  const password =
    env.ADMIN_PASSWORD?.trim() ||
    env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() ||
    "";
  const sessionSecret =
    env.ADMIN_SESSION_SECRET?.trim() ||
    env.ADMIN_PASSWORD?.trim() ||
    env.NEXT_PUBLIC_ADMIN_PASSWORD?.trim() ||
    "";

  return {
    password,
    sessionSecret,
    protectionEnabled: Boolean(password),
  };
}

export function createAdminSessionToken({
  secret,
  now = Date.now(),
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
} = {}) {
  if (!secret) {
    return "";
  }

  const payload = Buffer.from(
    JSON.stringify({
      exp: now + maxAgeSeconds * 1000,
      v: 1,
    })
  ).toString("base64url");

  return `${payload}.${signSessionPayload(payload, secret)}`;
}

export function verifyAdminSessionToken(
  token,
  {
    secret,
    now = Date.now(),
  } = {}
) {
  if (!token || !secret) {
    return false;
  }

  const [payload, signature] = String(token).split(".");

  if (!payload || !signature) {
    return false;
  }

  const expectedSignature = signSessionPayload(payload, secret);

  if (!safeEqual(signature, expectedSignature)) {
    return false;
  }

  try {
    const decodedPayload = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );

    if (typeof decodedPayload?.exp !== "number") {
      return false;
    }

    return decodedPayload.exp > now;
  } catch {
    return false;
  }
}

export function readAdminSessionCookieState(
  token,
  {
    env = process.env,
    now = Date.now(),
  } = {}
) {
  const authConfig = resolveAdminAuthConfig(env);

  if (!authConfig.protectionEnabled) {
    return {
      authenticated: true,
      protectionEnabled: false,
      shouldClearCookie: false,
    };
  }

  const authenticated = verifyAdminSessionToken(token, {
    secret: authConfig.sessionSecret,
    now,
  });

  return {
    authenticated,
    protectionEnabled: true,
    shouldClearCookie: Boolean(token) && !authenticated,
  };
}

export function buildAdminSessionCookieOptions({
  secure = false,
  maxAgeSeconds = ADMIN_SESSION_MAX_AGE_SECONDS,
} = {}) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}
