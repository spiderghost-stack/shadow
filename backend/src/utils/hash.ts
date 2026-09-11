import { createHash } from "node:crypto";

// Hash à sens unique pour tout ce qui ne doit jamais être stocké en clair
// mais doit rester comparable (refresh tokens, IP à des fins de sécurité).
export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
