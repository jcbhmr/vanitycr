#!/usr/bin/env -S deno serve -A
import assert from "node:assert/strict"
import { namespacePrefix, registry } from "./config.ts";
import once from "./once.ts";
import Router, { Route } from "./router.ts";

Deno.serve({ port, hostname }, (request) => {})

const app = new Router([
  new Route(new URLPattern({ pathname: "/_token" }), {
    async HEAD(request, match) {
      // @ts-ignore Don't know how to keep the `this` context in TypeScript types.
      const getResponse = await this.GET(request, match) as Response;
      return new Response(null, getResponse);
    },
    async GET(request, match) {
      const url = new URL(request.url);
      const tokenURL = new URL(await getTokenURL());
      assert(tokenURL.protocol === "https:", "token endpoint must use https:");
      url.protocol = tokenURL.protocol;
      url.port = "";
      url.host = tokenURL.host;
      url.pathname = tokenURL.pathname;
      if (namespacePrefix != null) {
        editScope: {
          let scope = url.searchParams.get("scope");
          if (scope == null) {
            break editScope;
          }
          scope = scope.replace("repository:", `repository:${namespacePrefix}`);
          url.searchParams.set("scope", scope);
        }
      }
      console.log(`Proxying ${url} for ${request.url}`);
      return await fetch(url, request);
    },
  }),
  new Route(new URLPattern({ pathname: "/v2/:path*" }), {
    async HEAD(request, match) {
      // @ts-ignore Don't know how to keep the `this` context in TypeScript types.
      const getResponse = await this.GET(request, match) as Response;
      return new Response(null, getResponse);
    },
    async GET(request, match) {
      const path = match.pathname.groups.path!;
      const url = new URL(request.url);
      url.protocol = "https:";
      url.port = "";
      url.host = registry;
      url.pathname = `/v2/${
        namespacePrefix != null ? namespacePrefix : ""
      }${path}`;
      const response = await fetch(url, {
        redirect: "manual",
        headers: {
          ...request.headers,
          ...(authorizationHeader != null
            ? { Authorization: authorizationHeader }
            : null),
        },
      });
      const responseHeaders = new Headers(response.headers);
      if (
        request.method === "GET" &&
        [301, 302, 307, 308].includes(response.status)
      ) {
        editLocation: {
          let location = responseHeaders.get("Location");
          if (location == null) {
            break editLocation;
          }
          location = new URL(location, `https://${registry}`).toString();
          responseHeaders.set("Location", location);
        }
      }
      editWWWAuthenticate: {
        const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("Host");
        assert(host != null, "Host header must be present");
        let wwwAuthenticate = responseHeaders.get("WWW-Authenticate");
        if (wwwAuthenticate == null) {
          break editWWWAuthenticate;
        }
        wwwAuthenticate = wwwAuthenticate.replace(
          /realm="(.*?)"/g,
          `realm="https://${host}/_token"`,
        );
        responseHeaders.set("WWW-Authenticate", wwwAuthenticate);
      }
      console.log(`Fetched ${url.toString()} on behalf of ${request.url}`);
      console.debug(await response.clone().text(), [...responseHeaders]);
      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    },
  }),
  new Route(new URLPattern(), {
    HEAD(request, match) {
      // @ts-ignore Don't know how to keep the `this` context in TypeScript types.
      const getResponse = this.GET(request, match) as Response;
      return new Response(null, getResponse);
    },
    GET(request, match) {
      const url = new URL(request.url);
      url.protocol = "https:";
      url.port = "";
      url.host = registry;
      if (namespacePrefix != null) {
        url.pathname = `/${namespacePrefix}${url.pathname.slice(1)}`;
      }
      console.log(`Redirecting ${request.url} to ${url.toString()}`);
      return Response.redirect(url.toString());
    },
  }),
]) satisfies Deno.ServeDefaultExport;
export { app as default };
