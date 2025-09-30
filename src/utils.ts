import { parse as parseForwarded } from "./forwarded.js";

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

export function serializeScope(
	scopeOrScopes:
		| { type: string; name: string; actions: string[] }
		| { type: string; name: string; actions: string[] }[],
) {
	const scopes = Array.isArray(scopeOrScopes) ? scopeOrScopes : [scopeOrScopes];
	return scopes
		.map((s) => `${s.type}:${s.name}:${s.actions.join(",")}`)
		.join(" ");
}

export function serializeWWWAuthenticate(
	challengeOrChallenges:
		| ({ scheme: string } & (
				| { token: string }
				| { params: Record<string, string> }
		  ))
		| ({ scheme: string } & (
				| { token: string }
				| { params: Record<string, string> }
		  ))[],
) {
	const challenges = Array.isArray(challengeOrChallenges)
		? challengeOrChallenges
		: [challengeOrChallenges];
	return challenges
		.map((c) => {
			if ("token" in c) {
				return `${c.scheme} ${c.token}`;
			} else {
				const params = Object.entries(c.params)
					.map(([k, v]) => `${k}="${v.replace(/"/g, '\\"')}"`)
					.join(", ");
				return `${c.scheme} ${params}`;
			}
		})
		.join(", ");
}
