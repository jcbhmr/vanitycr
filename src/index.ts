import process from "node:process";
import memoize from "micro-memoize";
import assert from "node:assert/strict";
import { z } from "zod";
import {Hono} from "hono"
import { getTokenURL, stringifyScope } from "./utils.ts";
import { zValidator } from "@hono/zod-validator";
import { parse as parseScope } from "../dist/scope.js";

export class App extends Hono {
  #registry: string;
  #namespacePrefix: string | undefined;
  constructor({registry, namespacePrefix}: { registry: string; namespacePrefix?: string }) {
    super();
    this.#registry = z.hostname().parse(registry);
    this.#namespacePrefix = z.stringFormat("namespace-prefix", /^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*\/$/).optional().parse(namespacePrefix);
    this.get("/", (c) => c.text("Hello, World!"));
    this.get("/_token", zValidator("query", z.object({
      scope: z.string().transform((s, ctx) => {
        try {
          return parseScope(s);
        } catch {
          ctx.addIssue({
            code: "custom",
            message: "invalid scope",
            input: s,
          })
          return z.NEVER;
        }
      }).refine(s => !!s.length).optional(),
    })), async (c) => {
      const url = new URL(await getTokenURL(this.#registry));
      url.search = new URL(c.req.url).search;
      const { scope } = c.req.valid("query");
      if (scope != null && this.#namespacePrefix != null) {
        const newScope = scope.map(s => ({
          type: s.type,
          name: `${this.#namespacePrefix}${s.name}`,
          actions: s.actions,
        }));
        url.searchParams.set("scope", stringifyScope(newScope))
      }
      return c.redirect(url.toString());
    })
    this.get("/v2/:path*", async (c) => {
      const path = c.req.param("path");
      console.log(path);
      return c.text(`v2 path is ${path}`);
    })
  }
}

const parsedEnv = z.object({
    REGISTRY: z.hostname().default("registry-1.docker.io"),
    NAMESPACE_PREFIX: z.stringFormat("namespace-prefix", /^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*\/$/).optional(),
}).parse(process.env);

const app = new App({ registry: parsedEnv.REGISTRY, namespacePrefix: parsedEnv.NAMESPACE_PREFIX });
export { app as default }

// async function tokenHandler(request: Request): Promise<Response> {
//           const url = new URL(await getTokenURL(registry));
//           url.search = new URL(request.url).search;
//           editIfPresent(url.searchParams, "scope", s => s.replace("repository:", `repository:${namespacePrefix}`));
//           console.log("Proxying %s for %s", url, request.url);
//           return fetch(url, request);
//         }
//         async function v2Handler(request: Request): Promise<Response> {
//           const url = new URL(request.url)
//           const path = url.pathname.slice("/v2/".length);
//           console.log("Request headers are %o", [...request.headers]);
//           console.log("Fetching %s", `https://${registry}/v2/${path === "" ? "" : namespacePrefix}${path}${url.search}`);
//           const response = await fetch(`https://${registry}/v2/${path === "" ? "" : namespacePrefix}${path}${url.search}`, request);
//           const responseHeaders = new Headers(response.headers);
//           editIfPresent(responseHeaders, "Location", l => new URL(l, `https://${registry}`).toString());
//           editIfPresent(responseHeaders, "WWW-Authenticate", w => w.replace(realmRe, `realm="${publicOrigin(request)}/_token"`));
//           console.log("New headers are %o", [...responseHeaders]);
//           return new Response(response.body, {
//             status: response.status,
//             statusText: response.statusText,
//             headers: responseHeaders,
//           });
//         }

//         Deno.serve((request) => {
//           const url = new URL(request.url);
//           if (url.pathname === "/_token") {
//             return tokenHandler(request);
//           } else if (url.pathname.startsWith("/v2/")) {
//             return v2Handler(request);
//           } else {
//             return new Response(null, { status: 404 } );
//           }
//         })

// // const server = serve({
// //     routes: {
// //         "/_token": tokenHandler,
// //         "/v2/*": v2Handler,
// //     },
// //   development: process.env.NODE_ENV !== "production",
// // })
// // console.log("Listening on %c%s", "color: green", server.url);
