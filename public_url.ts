export default function publicURL(request: Request): string {
    const url = new URL(request.url)
    {
        const forwarded = request.headers.get("Forwarded");
        if (forwarded) {
            const match = forwarded.match(/host=([^;]+)/);
            if (match) {
                url.port = "";
                url.host = match[1];
            }
            const match2 = forwarded.match(/proto=([^;]+)/);
            if (match2) {
                url.protocol = match2[1] + ":";
            }
        } else {
            const xForwardedHost = request.headers.get("X-Forwarded-Host");
            if (xForwardedHost) {
                url.port = "";
                url.host = xForwardedHost;
            }
            const xForwardedProto = request.headers.get("X-Forwarded-Proto");
            if (xForwardedProto) {
                url.protocol = xForwardedProto + ":";
            }
        }
    }
    return url.toString();
}