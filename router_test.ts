import assert from "node:assert/strict";
import Router, { Route } from "./router.ts";

Deno.test("router with GET, HEAD, and OPTIONS", async () => {
  const router = new Router([
    new Route(new URLPattern({ pathname: "/hello/:name" }), {
      HEAD(request, match) {
        // @ts-ignore Don't know how to keep the `this` context in TypeScript types.
        const getResponse = this.GET(request, match) as Response;
        return new Response(null, getResponse);
      },
      GET(request, match) {
        const name = decodeURIComponent(match.pathname.groups.name!);
        return new Response(`Hello, ${name}!`);
      },
    }),
  ]);
  const response = await router.fetch(
    new Request(
      `https://example.org/hello/${encodeURIComponent("Alan Turing")}`,
    ),
  );
  assert.strictEqual(response.status, 200);
  assert.strictEqual(await response.text(), "Hello, Alan Turing!");
});
