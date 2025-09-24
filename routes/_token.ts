import assert from "node:assert/strict"
import once from "../once.ts";
import { namespacePrefix, registry } from "../config.ts";

const getTokenURL = once(async () => {
  const response = await fetch(`https://${registry}/v2/`);
  if (!response.ok) {
    throw Object.assign(
      new Error(`${response.status} ${response.statusText}`),
      { response },
    );
  }
  const wwwAuthenticate = response.headers.get("WWW-Authenticate");
  if (wwwAuthenticate == null) {
    throw Object.assign(new Error("WWW-Authenticate header missing"), {
      response,
      wwwAuthenticate,
    });
  }
  const match = wwwAuthenticate.match(/realm="(.*?)"/);
  if (match == null) {
    throw Object.assign(new Error("realm missing in WWW-Authenticate header"), {
      response,
      wwwAuthenticate,
      match,
    });
  }
  assert.match(match[1], /^https:/);
  return match[1];
});

export async function GET(request: Request): Promise<Response> {
    const url = new URL(await getTokenURL());
    url.search = new URL(request.url).search;
    let scope = url.searchParams.get("scope");
    scope &&= scope.replace("repository:", `repository:${namespacePrefix ?? ""}`);
    scope && url.searchParams.set("scope", scope);
    return await fetch(url, request);
}