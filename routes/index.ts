import { indexRedirect } from "../config.ts";

export function GET() {
    if (indexRedirect) {
        return Response.redirect(indexRedirect);
    } else {
        return new Response(null, { status: 404 });
    }
}