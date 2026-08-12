# RoProxy Lite — Cloudflare Workers Edition

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

A high-performance, serverless, **Cloudflare Workers** compatible HTTP reverse proxy for Roblox APIs. 

This repository is a modernized TypeScript/Cloudflare Workers migration of [askfalse/roproxy-lite](https://github.com/askfalse/roproxy-lite), enabling zero-cost, zero-maintenance serverless proxying on Cloudflare's edge network without requiring a VPS, Docker server, or traditional Node.js server.

---

## ⚡ Features

- 🚀 **Serverless Edge Performance**: Powered by Cloudflare Workers (sub-millisecond latency worldwide, automatic scaling).
- 🔒 **Header-Based Authentication**: Support for authentication via `PROXYKEY` header matching the secret `KEY` environment variable (returns HTTP `407 Proxy Authentication Required` on failure).
- 🛡️ **SSRF & Open Proxy Defense**: Strict regex validation (`/^[a-zA-Z0-9-]+$/i`) ensures requests are routed strictly to legitimate Roblox subdomains (`https://<subdomain>.roblox.com/<path>`).
- 🔄 **Configurable Retries & Timeouts**: Automatic request retry loop with configurable `RETRIES` and `TIMEOUT` via `AbortSignal`.
- 🌐 **Full HTTP Method & Payload Support**: Supports `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD` methods and preserves request body payloads.
- 🎨 **CORS Enabled**: Automatic preflight `OPTIONS` handling and configurable `Access-Control-Allow-Origin` headers for web apps and browser-based projects.
- 🧹 **Header Cleaning & Key Protection**: Strips `PROXYKEY` before forwarding to Roblox (preventing secret key leakage) and overrides `User-Agent: RoProxy`.

---

## 🏗️ Architecture

```text
Client (Web App / Roblox Game)
             │
             │ HTTP Request (e.g. GET /games/v1/games/130582315)
             ▼
 ┌───────────────────────┐
 │  Cloudflare Worker    │
 │  1. Key Auth Check    │ ──► [Fail] HTTP 407 Proxy Authentication Required
 │  2. Route & Sanitize  │ ──► [Fail] HTTP 400 URL format invalid
 └───────────┬───────────┘
             │ Target: https://games.roblox.com/v1/games/130582315
             ▼
 ┌───────────────────────┐
 │ Roblox API Gateway    │ (https://*.roblox.com)
 └───────────┬───────────┘
             │ Return Status, Body & Headers
             ▼
 ┌───────────────────────┐
 │  Cloudflare Worker    │ Inject CORS headers & stream response
 └───────────┬───────────┘
             │
             ▼
Client Output Response
```

---

## 📁 Repository Structure

```text
roproxy-lite/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions workflow for automatic CI/CD deployment
├── src/
│   └── index.ts                # Main Cloudflare Worker TypeScript source
├── tests/
│   └── index.test.ts           # Vitest unit test suite (12 tests)
├── .gitignore                  # Git ignore rules for node_modules, wrangler cache, secrets
├── package.json                # npm package definition & scripts
├── tsconfig.json               # TypeScript compiler configuration
├── wrangler.toml               # Cloudflare Worker configuration & environment variables
├── README.md                   # Project documentation
├── main.go                     # Legacy Go server source (kept for reference)
├── go.mod                      # Legacy Go module definition
└── LICENSE                     # MIT License
```

---

## 📋 Requirements

Before deploying, make sure you have:

- **Node.js**: `v18.0.0` or higher (Tested on `v20.x` and `v24.x`).
- **npm**: `v9.0.0` or higher.
- **Cloudflare Account**: Free tier works completely.
- **Wrangler CLI**: `v3.x` (included in devDependencies).

---

## 🚀 Quick Start & Local Development

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/askfalse/roproxy-lite.git
cd roproxy-lite
npm install
```

### 2. Run Local Development Server

```bash
npm run dev
```

This starts a local development server using Wrangler at `http://localhost:8787`.

### 3. Test Local Requests

Open a new terminal and run sample requests:

#### A. Get Game Info (`games.roblox.com`)
```bash
curl "http://localhost:8787/games/v1/games?universeIds=130582315"
```

#### B. Get User Details (`users.roblox.com`)
```bash
curl "http://localhost:8787/users/v1/users/1"
```

#### C. Request with Authentication (`PROXYKEY`)
```bash
curl -H "PROXYKEY: my-secret-key" "http://localhost:8787/games/v1/games/130582315"
```

#### D. POST Request with Payload
```bash
curl -X POST "http://localhost:8787/users/v1/users" \
  -H "Content-Type: application/json" \
  -d "{\"userIds\": [1, 2, 3]}"
```

---

## 🧪 Testing & Verification

Run the Vitest test suite to verify routing, authentication, SSRF protection, query forwarding, and error handling:

```bash
npm test
```

Run TypeScript compilation / type check:

```bash
npm run build
```

---

## ⚙️ Configuration

### Environment Variables (`wrangler.toml`)

Non-sensitive default variables are defined in `wrangler.toml`:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `TIMEOUT` | `"5"` | Request timeout in seconds before retrying |
| `RETRIES` | `"5"` | Maximum number of retry attempts on network failure |

### Secrets (`KEY`)

To restrict proxy access with a secret key:

```bash
npx wrangler secret put KEY
```

When prompted, type your desired key (e.g. `super-secret-passcode`). Clients must include a matching `PROXYKEY` header in requests:

```http
GET /games/v1/games/123 HTTP/1.1
Host: your-worker.workers.dev
PROXYKEY: super-secret-passcode
```

If `KEY` is unset or empty, the proxy allows public requests without authentication.

---

## 🌐 Deploying to Cloudflare Workers

### Step 1: Login to Cloudflare
```bash
npx wrangler login
```
A browser tab will open allowing you to authorize Wrangler.

### Step 2: Set Auth Secret (Optional)
```bash
npx wrangler secret put KEY
```

### Step 3: Publish Worker
```bash
npx wrangler deploy
```

Upon successful deployment, Wrangler will print your public Worker URL:
`https://roproxy-lite.<your-subdomain>.workers.dev`

---

## 🔗 Custom Domain Setup

To route requests through your own custom domain (e.g., `proxy.mywebsite.com`):

1. **Add Domain to Cloudflare**: Log in to [Cloudflare Dashboard](https://dash.cloudflare.com) and add your apex domain (`mywebsite.com`). Update your registrar's nameservers to Cloudflare.
2. **Attach Custom Domain**:
   - Go to **Workers & Pages** > **roproxy-lite** > **Settings** > **Triggers**.
   - Click **Add Custom Domain** under **Custom Domains**.
   - Enter your domain/subdomain (e.g., `proxy.mywebsite.com`).
3. **Verify**: Cloudflare automatically manages DNS records and SSL/TLS certificates. Test via HTTPS:
   ```bash
   curl "https://proxy.mywebsite.com/games/v1/games/130582315"
   ```

---

## 🤖 GitHub Actions CI/CD Deployment

Automatic deployment on every `git push` to `main` branch is supported via GitHub Actions:

1. Obtain a Cloudflare API Token in **My Profile** > **API Tokens** > **Create Token** (using the *Edit Cloudflare Workers* template).
2. Go to your GitHub repository > **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
3. Name: `CLOUDFLARE_API_TOKEN` | Value: `<your-cloudflare-api-token>`.
4. Pushing commits to `main` will automatically build, test, and deploy your Worker using [.github/workflows/deploy.yml](.github/workflows/deploy.yml).

---

## 🛡️ Security Features

1. **SSRF & Open Proxy Defense**: Subdomains are sanitized via `/^[a-zA-Z0-9-]+$/i`. Outbound requests are strictly bound to `https://<subdomain>.roblox.com/`. Attempting to proxy to arbitrary third-party URLs (`example.com`, external IPs) will be rejected with HTTP 400.
2. **Secret Header Filtering**: The `PROXYKEY` header is deleted before forwarding requests to Roblox, ensuring authentication credentials are never exposed to Roblox servers.
3. **Header Sanitization**: Removes potentially dangerous or spoofed headers (`Roblox-Id`, `Host`) and sets standard `User-Agent: RoProxy`.

---

## 💰 Free Tier & Usage Limits

Cloudflare Workers includes a generous free tier:

- **Daily Request Allowance**: 100,000 requests/day (resets daily at 00:00 UTC).
- **CPU Limit**: Up to 10ms CPU runtime per request (network wait time for Roblox fetch responses does not count against CPU time).
- **Bandwidth**: Unlimited under standard Cloudflare terms.
- **Roblox Rate Limits**: Roblox APIs apply their own IP/user rate limits. If high volume is proxied from a single region, Roblox may return HTTP `429 Too Many Requests`.

---

## ❓ Troubleshooting

| Error / Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| **HTTP 407 Proxy Authentication Required** | `KEY` is configured in Cloudflare but `PROXYKEY` header is missing or incorrect | Provide header `PROXYKEY: <your-key>` in request or update `KEY` secret via `wrangler secret put KEY`. |
| **HTTP 400 URL format invalid** | Path does not match `/<subdomain>/<path>` | Format request as `/subdomain/path` (e.g. `/games/v1/games/123`). |
| **HTTP 500 Proxy failed to connect** | Target Roblox endpoint unreachable or request timed out | Verify Roblox status or increase `TIMEOUT` / `RETRIES` in `wrangler.toml`. |
| **HTTP 429 Too Many Requests** | Roblox API rate limit hit | Roblox is rate-limiting the requests. Provide `.ROBLOSECURITY` cookie or retry after backoff. |

---

## 📄 License

MIT License. Derived from [askfalse/roproxy-lite](https://github.com/askfalse/roproxy-lite).
