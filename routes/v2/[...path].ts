import { authorizationHeader, namespacePrefix, registry } from "../../config.ts";
import publicURL from "../../public_url.ts";

export async function GET(request: Request, { path }: { path: string }): Promise<Response> {
    const search = new URL(request.url).search;
    const response = await fetch(`https://${registry}/${namespacePrefix ?? ""}${path}${search}`, {
        redirect: "manual",
        headers: {
            ...request.headers,
            ...(authorizationHeader != null
                ? { Authorization: authorizationHeader }
                : null),
        }
    })
    const headers = new Headers(response.headers);
    if (300 <= response.status && response.status < 400) {
        let location = headers.get("Location");
        location &&= new URL(location, publicURL(request)).toString();
        location && headers.set("Location", location);
    }
    let wwwAuthenticate = headers.get("WWW-Authenticate");
    wwwAuthenticate &&= wwwAuthenticate.replace(
        /realm="(.*?)"/,
        `realm="${new URL(publicURL(request)).origin}/_token"`,
    );
    wwwAuthenticate && headers.set("WWW-Authenticate", wwwAuthenticate);
    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
    });
}