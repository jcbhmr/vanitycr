import { namespacePrefix, registry } from "../config.ts";

export function GET(request: Request, { path }: { path: string }): Response {
    const search = new URL(request.url).search;
    return Response.redirect(`https://${registry}/${namespacePrefix ?? ""}${path}${search}`);
}