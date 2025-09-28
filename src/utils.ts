import { parse as parseForwarded } from "../dist/forwarded.js";
import memoize from "micro-memoize";
import { parse as parseWWWAuthenticate } from "../dist/www-authenticate.js";

export function originalURL(request: Request) {
    const url = new URL(request.url);
    const forwarded = request.headers.get("Forwarded");
    if (forwarded != null) {
        const v = parseForwarded(forwarded);
        if (v.length && v[0].proto != null && v[0].host != null) {
            url.protocol = v[0].proto;
            url.port = "";
            url.host = v[0].host;
        }
    } else {
        const xfp = request.headers.get("X-Forwarded-Proto");
        const xfh = request.headers.get("X-Forwarded-Host");
        if (xfp != null && xfh != null) {
            url.protocol = xfp + ":";
            url.port = "";
            url.host = xfh;
        }
    }
    return url.toString();
}

// @ts-ignore Wrong micro-memoize types
export const getTokenURL: (registry: string) => Promise<string> = memoize(async (registry: string) => {
  const response = await fetch(`https://${registry}/v2/`, { method: "HEAD" });
  try {
    await response.body?.cancel()
  } catch {}
  if (!(400 <= response.status && response.status < 500)) {
    throw Object.assign(new Error(`Expected 4xx status from ${response.url}, got ${response.status}`), { response });
  }

  const wwwAuthenticate = response.headers.get("WWW-Authenticate");
  if (wwwAuthenticate == null) {
    throw Object.assign(new Error("missing WWW-Authenticate header"), { response });
  }

  const parsedWWWAuthenticate = parseWWWAuthenticate(wwwAuthenticate);
  if (parsedWWWAuthenticate.length && parsedWWWAuthenticate[0].scheme === "bearer" && (parsedWWWAuthenticate[0] as any).params?.realm != null) {
    const realmURL = (parsedWWWAuthenticate[0] as any).params.realm;
    if (!URL.canParse(realmURL)) {
      throw Object.assign(new Error(`malformed bearer realm URL: ${realmURL}`), { response, realmURL });
    }
    return realmURL;
  }
  throw Object.assign(new Error("missing bearer realm in WWW-Authenticate header"), { response, parsedWWWAuthenticate });
})

export function stringifyScope(scopeOrScopes: { type: string; name: string; actions: string[]; } | { type: string; name: string; actions: string[]; }[]) {
  const scopes = Array.isArray(scopeOrScopes) ? scopeOrScopes : [scopeOrScopes];
  return scopes.map(s => `${s.type}:${s.name}:${s.actions.join(",")}`).join(" ");
}
