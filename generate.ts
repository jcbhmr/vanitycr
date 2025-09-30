#!/usr/bin/env node
import { $ } from "execa";

await $`peggy --format es --dts --return-types ${JSON.stringify({
	Forwarded: "Record<string, string>[]",
})} ./src/forwarded.pegjs`;

await $`peggy --format es --dts --return-types ${JSON.stringify({
	WWWAuthenticate:
		"({ scheme: string; } & ({ token: string; } | { params: Record<string, string>; }))[]",
})} ./src/www-authenticate.pegjs`;

await $`peggy --format es --dts --return-types ${JSON.stringify({
	Scope: "{ type: string; name: string; actions: string[]; }[]",
})} ./src/scope.pegjs`;
