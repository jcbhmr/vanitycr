import process from "node:process";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Buffer } from "node:buffer";

export const registry = (() => {
  const raw = process.env.VANITYCR_REGISTRY || "docker.io";
  const url = new URL(`https://unset.invalid`);
  url.host = raw;
  assert.notStrictEqual(url.host, "unset.invalid");
  return url.host;
})();

export const namespacePrefix = (() => {
  const raw = process.env.VANITYCR_NAMESPACE_PREFIX;
  if (raw) {
    assert.match(raw, /^[a-zA-Z0-9_\/.-]+\/$/)
    return raw;
  }
  return null;
})();

export const authorizationHeader = await (async () => {
  const authHeaderRaw = process.env.VANITYCR_AUTH_HEADER;
  const googleCredentialsRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (authHeaderRaw) {
    return authHeaderRaw;
  } else if (googleCredentialsRaw) {
    const key = await readFile(googleCredentialsRaw, "utf-8");
    return `Basic ${Buffer.from(`_json_key:${key}`).toString("base64")}`;
  }
  return null;
})();

export const indexRedirect = (() => {
  const raw = process.env.VANITYCR_INDEX_REDIRECT;
  if (raw) {
    const url = new URL(raw);
    assert.match(url.protocol, /^https?:$/);
    return url.toString();
  }
  if (registry === "ghcr.io" && namespacePrefix != null) {
    const userOrOrg = namespacePrefix.split("/")[0];
    return `https://github.com/${userOrOrg}`;
  } else if (registry === "docker.io" && namespacePrefix != null) {
    const userOrOrg = namespacePrefix.split("/")[0];
    return `https://hub.docker.com/u/${userOrOrg}`;
  } else if (registry === "docker.io") {
    return `https://hub.docker.com`;
  }
  return null;
})()
