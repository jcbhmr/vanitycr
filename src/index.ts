import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import { parse as parseScope } from "./scope.js";
import {
	originalURL,
	serializeScope,
	serializeWWWAuthenticate,
} from "./utils.ts";
import { OCI_NAMESPACE, OCI_ROOT_URL } from "./env.ts";
import { proxy } from "hono/proxy";
import { parse as parseWWWAuthenticate } from "./www-authenticate.js";
import { getRouterName, showRoutes } from "hono/dev";

const app = new Hono();
export { app as default }

app.get("/", (c) => c.text("Hello, World!"));
app.get(
	"/_token/:tokenURL",
	zValidator(
		"param",
		z.object({
			tokenURL: z
				.url({ hostname: z.regexes.domain, protocol: /^https$/ })
				.transform((v) => new URL(v)),
		}),
	),
	async (c) => {
		const { tokenURL } = c.req.valid("param");
		const url = new URL(tokenURL);
		url.search = new URL(c.req.url).search;
		let scope = c.req.query("scope");
		if (scope != null && OCI_NAMESPACE != null) {
			scope = scope.replaceAll("repository:", `repository:${OCI_NAMESPACE}/`);
			url.searchParams.set("scope", scope)
		}
		console.log("redirect(%o)", url.toString());
		return c.redirect(url.toString(), 307);
	},
);
app.get("/v2/:path{.*}", async (c) => {
	const remoteURL = new URL(OCI_ROOT_URL);
	const urlObject = new URL(c.req.url);
	if (OCI_NAMESPACE != null && urlObject.pathname !== "/v2/") {
		const rest = urlObject.pathname.slice("/v2/".length);
		remoteURL.pathname = `/v2/${OCI_NAMESPACE}/${rest}`;
	} else {
		remoteURL.pathname = urlObject.pathname;
	}
	remoteURL.search = urlObject.search;
	if (c.req.header("Authorization") != null) {
		return c.redirect(remoteURL.toString(), 307);
	}
	const res = await proxy(remoteURL, c.req);
	console.log("proxy(%o %o) => %o", c.req.method, remoteURL.toString(), res.status);
	let wwwAuthenticate = res.headers.get("WWW-Authenticate");
	if (wwwAuthenticate != null && OCI_NAMESPACE != null) {
		const parsedWWWAuthenticate = parseWWWAuthenticate(wwwAuthenticate);
		if (
			parsedWWWAuthenticate[0] != null &&
			"params" in parsedWWWAuthenticate[0] &&
			parsedWWWAuthenticate[0].params.realm != null
		) {
			parsedWWWAuthenticate[0].params.realm = new URL(
				`/_token/${encodeURIComponent(parsedWWWAuthenticate[0].params.realm)}`,
				originalURL(c.req.raw),
			).toString();
			wwwAuthenticate = serializeWWWAuthenticate(parsedWWWAuthenticate);
			res.headers.set("WWW-Authenticate", wwwAuthenticate);
		}
	}
	return res;
});

console.log({ OCI_ROOT_URL: OCI_ROOT_URL.toString(), OCI_NAMESPACE })
console.log(getRouterName(app))
showRoutes(app, {
  verbose: true,
})
