import { z } from "zod";

export const { OCI_ROOT_URL, OCI_NAMESPACE } = z
	.object({
		OCI_ROOT_URL: z
			.url({ hostname: z.regexes.domain, protocol: /^https$/ })
			.transform((v) => new URL(v))
			.prefault("https://registry-1.docker.io/"),
		OCI_NAMESPACE: z
			.stringFormat(
				"name",
				/^[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*(\/[a-z0-9]+((\.|_|__|-+)[a-z0-9]+)*)*$/,
			)
			.optional(),
	})
	.parse(process.env);
