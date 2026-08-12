import { renderLandingPage } from "./landing";

export interface Env {
  KEY?: string;
  TIMEOUT?: string;
  RETRIES?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const rawPath = url.pathname.slice(1);

    // Serve custom landing page at root path /
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(renderLandingPage(request.url), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Handle CORS preflight request (OPTIONS)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 1. Authentication Check
    // Matches Go code: if KEY env var is set, PROXYKEY header must match KEY value.
    if (env.KEY && env.KEY.trim() !== "") {
      const proxyKeyHeader = request.headers.get("PROXYKEY");
      if (proxyKeyHeader !== env.KEY) {
        return new Response("Missing or invalid PROXYKEY header.", {
          status: 407,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }

    // 2. URL parsing & routing
    // Extract path after leading slash e.g., /games/v1/games/12345
    const firstSlashIndex = rawPath.indexOf("/");
    if (firstSlashIndex === -1 || firstSlashIndex === 0) {
      return new Response("URL format invalid.", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const subdomain = rawPath.substring(0, firstSlashIndex);
    const targetPath = rawPath.substring(firstSlashIndex + 1);

    // Validate subdomain format (allow only valid Roblox subdomains to prevent SSRF / domain injection)
    if (!/^[a-zA-Z0-9-]+$/i.test(subdomain)) {
      return new Response("URL format invalid.", {
        status: 400,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Reconstruct target Roblox API URL
    const targetUrl = `https://${subdomain}.roblox.com/${targetPath}${url.search}`;

    // Configurable timeout & retries
    const timeoutSeconds = parseInt(env.TIMEOUT || "5", 10) || 5;
    const maxRetries = parseInt(env.RETRIES || "5", 10) || 5;

    // Execute proxy request with retries
    return await makeRequest(request, targetUrl, timeoutSeconds, maxRetries);
  },
};

async function makeRequest(
  incomingRequest: Request,
  targetUrl: string,
  timeoutSeconds: number,
  maxRetries: number
): Promise<Response> {
  // Clone incoming headers
  const forwardHeaders = new Headers(incomingRequest.headers);

  // Apply RoProxy header modifications
  forwardHeaders.set("User-Agent", "RoProxy");
  forwardHeaders.delete("Roblox-Id");
  forwardHeaders.delete("PROXYKEY");
  forwardHeaders.delete("host");

  const method = incomingRequest.method;
  const hasBody = !["GET", "HEAD"].includes(method.toUpperCase());

  // Buffer request body if body exists and retries > 1, so it can be re-sent on retry
  let bodyBuffer: ArrayBuffer | null = null;
  if (hasBody) {
    try {
      bodyBuffer = await incomingRequest.arrayBuffer();
    } catch {
      bodyBuffer = null;
    }
  }

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutSeconds * 1000);

    try {
      const fetchBody = hasBody ? bodyBuffer : null;
      const outboundResponse = await fetch(targetUrl, {
        method: method,
        headers: forwardHeaders,
        body: fetchBody,
        signal: controller.signal,
        redirect: "manual",
      });

      clearTimeout(timeoutId);

      // Create new response headers to modify CORS headers safely
      const responseHeaders = new Headers(outboundResponse.headers);

      if (!responseHeaders.has("Access-Control-Allow-Origin")) {
        responseHeaders.set("Access-Control-Allow-Origin", "*");
      }
      if (!responseHeaders.has("Access-Control-Allow-Headers")) {
        responseHeaders.set("Access-Control-Allow-Headers", "*");
      }
      if (!responseHeaders.has("Access-Control-Allow-Methods")) {
        responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD");
      }

      return new Response(outboundResponse.body, {
        status: outboundResponse.status,
        statusText: outboundResponse.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      clearTimeout(timeoutId);
      if (attempt >= maxRetries) {
        return new Response("Proxy failed to connect. Please try again.", {
          status: 500,
          headers: {
            "Content-Type": "text/plain",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }
    }
  }

  return new Response("Proxy failed to connect. Please try again.", {
    status: 500,
    headers: {
      "Content-Type": "text/plain",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
