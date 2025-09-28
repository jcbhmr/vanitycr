import { $ } from "execa";

await $`peggy --output dist/forwarded.js --format es --dts --return-types ${JSON.stringify({
    "Forwarded": "Record<string, string>[]"
})} src/forwarded.pegjs`;

await $`peggy --output dist/www-authenticate.js --format es --dts --return-types ${JSON.stringify({
    "WWWAuthenticate": "({ scheme: string; } & ({ token: string; } | { params: Record<string, string>; }))[]",
})} src/www-authenticate.pegjs`;

await $`peggy --output dist/scope.js --format es --dts --return-types ${JSON.stringify({
    "Scope": "{ type: string; name: string; actions: string[]; }[]",
})} src/scope.pegjs`;
