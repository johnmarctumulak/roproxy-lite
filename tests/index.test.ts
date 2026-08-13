import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import worker, { Env } from "../src/index";

describe("RoProxy Lite Cloudflare Worker", () => {
  const dummyCtx = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn(),
  } as unknown as ExecutionContext;

  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("1. Forward valid GET request to target Roblox API", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 1, name: "Test Game" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = mockFetch;

    const request = new Request("http://localhost/games/v1/games/12345");
    const response = await worker.fetch(request, {}, dummyCtx);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual({ data: [{ id: 1, name: "Test Game" }] });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [targetUrl, options] = mockFetch.mock.calls[0];
    expect(targetUrl).toBe("https://games.roblox.com/v1/games/12345");
    expect(options.method).toBe("GET");
    expect((options.headers as Headers).get("User-Agent")).toBe("RoProxy");
  });

  it("1b. Forward subdomain-style request (games.roproxy-lite.workers.dev/v1/games/12345) to target Roblox API", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 1, name: "Test Game" }] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = mockFetch;

    const request = new Request("http://games.roproxy-lite.workers.dev/v1/games/12345");
    const response = await worker.fetch(request, {}, dummyCtx);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [targetUrl, options] = mockFetch.mock.calls[0];
    expect(targetUrl).toBe("https://games.roblox.com/v1/games/12345");
    expect(options.method).toBe("GET");
  });

  it("2. Return 200 HTML landing page for root path / and 400 for invalid subdomain path", async () => {
    const req1 = new Request("http://localhost/");
    const res1 = await worker.fetch(req1, {}, dummyCtx);
    expect(res1.status).toBe(200);
    expect(res1.headers.get("Content-Type")).toContain("text/html");
    expect(await res1.text()).toContain("RoProxy Lite");

    const req2 = new Request("http://localhost/games");
    const res2 = await worker.fetch(req2, {}, dummyCtx);
    expect(res2.status).toBe(400);
    expect(await res2.text()).toBe("URL format invalid.");
  });

  it("3. Return 407 when KEY env var is set and PROXYKEY header is missing", async () => {
    const env: Env = { KEY: "my-secret-key" };
    const request = new Request("http://localhost/games/v1/games/123");
    const response = await worker.fetch(request, env, dummyCtx);

    expect(response.status).toBe(407);
    expect(await response.text()).toBe("Missing or invalid PROXYKEY header.");
  });

  it("4. Return 407 when KEY env var is set and PROXYKEY header is incorrect", async () => {
    const env: Env = { KEY: "my-secret-key" };
    const request = new Request("http://localhost/games/v1/games/123", {
      headers: { PROXYKEY: "wrong-key" },
    });
    const response = await worker.fetch(request, env, dummyCtx);

    expect(response.status).toBe(407);
    expect(await response.text()).toBe("Missing or invalid PROXYKEY header.");
  });

  it("5. Allow request when PROXYKEY matches KEY env var", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    globalThis.fetch = mockFetch;

    const env: Env = { KEY: "my-secret-key" };
    const request = new Request("http://localhost/games/v1/games/123", {
      headers: { PROXYKEY: "my-secret-key" },
    });
    const response = await worker.fetch(request, env, dummyCtx);

    expect(response.status).toBe(200);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Verify PROXYKEY header was stripped from outgoing request to Roblox
    const forwardedHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(forwardedHeaders.get("PROXYKEY")).toBeNull();
  });

  it("6. Block invalid/malicious subdomain formats (SSRF / domain injection protection)", async () => {
    const invalidSubdomains = [
      "evil.com#",
      "google.com/test",
      "roblox.com.attacker.com",
      "sub_domain",
      "games.roblox.com?",
    ];

    for (const sub of invalidSubdomains) {
      const req = new Request(`http://localhost/${sub}/v1/test`);
      const res = await worker.fetch(req, {}, dummyCtx);
      expect(res.status).toBe(400);
      expect(await res.text()).toBe("URL format invalid.");
    }
  });

  it("7. Forward query parameters correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    globalThis.fetch = mockFetch;

    const request = new Request("http://localhost/users/v1/users/search?keyword=builderman&limit=10");
    await worker.fetch(request, {}, dummyCtx);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toBe("https://users.roblox.com/v1/users/search?keyword=builderman&limit=10");
  });

  it("8. Forward request headers and strip Roblox-Id", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    globalThis.fetch = mockFetch;

    const request = new Request("http://localhost/economy/v1/assets", {
      headers: {
        "Roblox-Id": "12345",
        "X-Custom-Header": "CustomValue",
        "Cookie": ".ROBLOSECURITY=abcdef",
      },
    });

    await worker.fetch(request, {}, dummyCtx);

    const forwardedHeaders = mockFetch.mock.calls[0][1].headers as Headers;
    expect(forwardedHeaders.get("User-Agent")).toBe("RoProxy");
    expect(forwardedHeaders.get("Roblox-Id")).toBeNull();
    expect(forwardedHeaders.get("X-Custom-Header")).toBe("CustomValue");
    expect(forwardedHeaders.get("Cookie")).toBe(".ROBLOSECURITY=abcdef");
  });

  it("9. Forward POST request body correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    globalThis.fetch = mockFetch;

    const payload = JSON.stringify({ userIds: [1, 2, 3] });
    const request = new Request("http://localhost/users/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });

    const response = await worker.fetch(request, {}, dummyCtx);
    expect(response.status).toBe(200);

    const fetchOptions = mockFetch.mock.calls[0][1];
    expect(fetchOptions.method).toBe("POST");
    expect(fetchOptions.body).toBeDefined();

    const sentBodyText = new TextDecoder().decode(fetchOptions.body as ArrayBuffer);
    expect(sentBodyText).toBe(payload);
  });

  it("10. Respond to CORS OPTIONS preflight request", async () => {
    const request = new Request("http://localhost/games/v1/games", { method: "OPTIONS" });
    const response = await worker.fetch(request, {}, dummyCtx);

    expect(response.status).toBe(204);
    expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(response.headers.get("Access-Control-Allow-Methods")).toContain("GET");
  });

  it("11. Preserve Roblox API error status codes (400, 401, 403, 404, 429, 500)", async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ errors: [{ code: 1, message: "User not found" }] }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      })
    );
    globalThis.fetch = mockFetch;

    const request = new Request("http://localhost/users/v1/users/99999999999");
    const response = await worker.fetch(request, {}, dummyCtx);

    expect(response.status).toBe(404);
    const body = (await response.json()) as { errors: Array<{ message: string }> };
    expect(body.errors[0].message).toBe("User not found");
  });

  it("12. Retry network errors up to RETRIES limit and return 500 on failure", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network connection failed"));
    globalThis.fetch = mockFetch;

    const env: Env = { RETRIES: "3", TIMEOUT: "1" };
    const request = new Request("http://localhost/games/v1/games/123");
    const response = await worker.fetch(request, env, dummyCtx);

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Proxy failed to connect. Please try again.");
  });

  it("13. Stream POST request body directly when RETRIES=1 with duplex: half", async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response("OK", { status: 200 }));
    globalThis.fetch = mockFetch;

    const env: Env = { RETRIES: "1" };
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("test stream data"));
        controller.close();
      },
    });

    const request = new Request("http://localhost/users/v1/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: stream,
      duplex: "half",
    } as RequestInit & { duplex?: string });

    const response = await worker.fetch(request, env, dummyCtx);
    expect(response.status).toBe(200);

    const options = mockFetch.mock.calls[0][1];
    expect(options.duplex).toBe("half");
  });

  it("14. Return /api/stats JSON telemetry endpoint", async () => {
    const request = new Request("http://localhost/api/stats");
    const response = await worker.fetch(request, {}, dummyCtx);

    expect(response.status).toBe(200);
    const data = (await response.json()) as { status: string; total_requests: number };
    expect(data.status).toBe("Operational");
    expect(typeof data.total_requests).toBe("number");
  });
});

