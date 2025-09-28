import {serve} from "@hono/node-server"
import { App } from "./index.ts";
import process from "node:process"
import { z } from "zod";
import { parseArgs } from "node:util";
import packageJSON from "../package.json" with { type: "json" };
import type { AddressInfo } from "node:net";

const parsedEnv = z.object({
    NODE_PORT: z.coerce.number().int().min(1).max(65535).optional(),
    PORT: z.coerce.number().int().min(1).max(65535).optional(),
    REGISTRY: z.hostname().optional(),
    NAMESPACE_PREFIX: z.stringFormat("namespace-prefix", /^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*\/$/).optional(),
}).parse(process.env);

const argsRaw = parseArgs({
  options: {
    help: { type: 'boolean', default: false },
    version: { type: 'boolean', default: false },
    port: { type: 'string' },
    hostname: { type: 'string' },
    registry: { type: 'string' },
    "namespace-prefix": { type: 'string' },
  }
})
const flags = z.object({
  help: z.boolean(),
  version: z.boolean(),
  port: z.coerce.number().int().min(1).max(65535).optional(),
  hostname: z.hostname().optional(),
  registry: z.hostname().optional(),
  "namespace-prefix": z.stringFormat("namespace-prefix", /^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*\/$/).optional(),
}).parse(argsRaw.values);

if (flags.help) {
  console.log(`https://github.com/jcbhmr/vanitycr#readme`);
  process.exit(0);
}

if (flags.version) {
  console.log(packageJSON.version)
}

const hostname = flags.hostname ?? "0.0.0.0";
const port = flags.port ?? parsedEnv.NODE_PORT ?? parsedEnv.PORT ?? 8080;

const registry = flags.registry ?? parsedEnv.REGISTRY ?? "registry-1.docker.io";
const namespacePrefix = flags["namespace-prefix"] ?? parsedEnv.NAMESPACE_PREFIX;

const app = new App({ registry, namespacePrefix });
const server = serve({
  fetch: app.fetch,
  hostname,
  port,
})
server.once("listening", () => {
  const addr = server.address() as AddressInfo;
  console.log(`Listening on http://${addr.address}:${addr.port}`);
})
process.once('SIGINT', () => {
  server.close()
})
process.once('SIGTERM', () => {
  server.close()
})
