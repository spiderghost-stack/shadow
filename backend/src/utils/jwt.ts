import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  userId: string;
  deviceId: string;
}

// Access token courte durée de vie : signé, jamais stocké côté serveur.
export function signAccessToken(payload: AccessTokenPayload): string {
  const options = { expiresIn: env.jwtAccessTtl } as unknown as jwt.SignOptions;
  return jwt.sign(payload, env.jwtAccessSecret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.jwtAccessSecret) as AccessTokenPayload;
}

// Le refresh token est signé UNE FOIS puis remis au client ; seul son hash
// (SHA-256) est conservé côté serveur (table sessions.refresh_token_hash),
// pour pouvoir le révoquer sans jamais avoir eu à le stocker en clair.
export interface RefreshTokenPayload {
  sessionId: string;
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  const options = { expiresIn: `${env.jwtRefreshTtlDays}d` } as unknown as jwt.SignOptions;
  return jwt.sign(payload, env.jwtRefreshSecret, options);
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as RefreshTokenPayload;
}
