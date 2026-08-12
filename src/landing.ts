export function renderLandingPage(currentUrl: string): string {
  const urlObj = new URL(currentUrl);
  const hostUrl = urlObj.origin; // e.g. https://roproxy-lite.lylatumulak.workers.dev

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RoProxy Lite — Serverless Roblox API Proxy</title>
  <meta name="description" content="A fast, reliable, zero-latency Cloudflare Workers reverse proxy for Roblox API endpoints. Unrestricted access for Roblox developers.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600&family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #07090e;
      --bg-card: rgba(15, 23, 42, 0.65);
      --bg-card-hover: rgba(30, 41, 59, 0.75);
      --border-color: rgba(255, 255, 255, 0.08);
      --border-accent: rgba(56, 189, 248, 0.3);
      --primary-cyan: #38bdf8;
      --primary-amber: #fbbf24;
      --primary-emerald: #34d399;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
      --font-mono: 'Fira Code', monospace;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-sans);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
      position: relative;
    }

    /* Ambient Glow Effects */
    .glow-bg {
      position: fixed;
      top: -20%;
      left: 50%;
      transform: translateX(-50%);
      width: 800px;
      height: 500px;
      background: radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(251, 191, 36, 0.05) 40%, transparent 70%);
      filter: blur(80px);
      pointer-events: none;
      z-index: 0;
    }

    .glow-bg-2 {
      position: fixed;
      bottom: -20%;
      right: -10%;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(52, 211, 153, 0.08) 0%, transparent 70%);
      filter: blur(100px);
      pointer-events: none;
      z-index: 0;
    }

    /* Header Nav */
    header {
      position: fixed;
      top: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      width: calc(100% - 3rem);
      max-width: 900px;
      z-index: 100;
      background: rgba(15, 23, 42, 0.75);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid var(--border-color);
      border-radius: 9999px;
      padding: 0.75rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    }

    .logo-container {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--text-main);
      font-weight: 700;
      font-size: 1.1rem;
      letter-spacing: -0.02em;
    }

    .logo-badge {
      background: linear-gradient(135deg, var(--primary-cyan), var(--primary-emerald));
      width: 28px;
      height: 28px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0f172a;
      font-weight: 900;
      font-size: 0.95rem;
      box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(52, 211, 153, 0.1);
      border: 1px solid rgba(52, 211, 153, 0.25);
      color: var(--primary-emerald);
      font-size: 0.8rem;
      font-weight: 600;
      padding: 0.35rem 0.85rem;
      border-radius: 9999px;
    }

    .status-dot {
      width: 7px;
      height: 7px;
      background-color: var(--primary-emerald);
      border-radius: 50%;
      box-shadow: 0 0 8px var(--primary-emerald);
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(0.85); }
    }

    /* Main Container */
    main {
      flex: 1;
      position: relative;
      z-index: 10;
      width: 100%;
      max-width: 1000px;
      margin: 0 auto;
      padding: 8rem 1.5rem 4rem;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    /* Hero Section */
    .hero {
      text-align: center;
      max-width: 750px;
      margin-bottom: 3.5rem;
    }

    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(56, 189, 248, 0.08);
      border: 1px solid rgba(56, 189, 248, 0.2);
      color: var(--primary-cyan);
      font-size: 0.85rem;
      font-weight: 500;
      padding: 0.4rem 1rem;
      border-radius: 9999px;
      margin-bottom: 1.5rem;
    }

    .hero-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -0.03em;
      margin-bottom: 1.25rem;
      background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-title span {
      background: linear-gradient(135deg, var(--primary-cyan) 0%, var(--primary-emerald) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .hero-subtitle {
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    /* Converter Card Component */
    .converter-card {
      width: 100%;
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      margin-bottom: 4rem;
      transition: border-color 0.3s ease;
    }

    .converter-card:hover {
      border-color: var(--border-accent);
    }

    .converter-label {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    @media (min-width: 640px) {
      .input-group {
        flex-direction: row;
      }
    }

    .url-input {
      flex: 1;
      background: rgba(7, 9, 14, 0.8);
      border: 1px solid var(--border-color);
      border-radius: 0.85rem;
      padding: 0.9rem 1.25rem;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--text-main);
      outline: none;
      transition: all 0.2s ease;
    }

    .url-input:focus {
      border-color: var(--primary-cyan);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.15);
    }

    .output-box {
      flex: 1;
      background: rgba(7, 9, 14, 0.95);
      border: 1px solid var(--border-color);
      border-radius: 0.85rem;
      padding: 0.9rem 1.25rem;
      font-family: var(--font-mono);
      font-size: 0.9rem;
      color: var(--primary-cyan);
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow: hidden;
      min-height: 48px;
    }

    .output-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-right: 0.5rem;
    }

    .copy-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: linear-gradient(135deg, var(--primary-cyan), #0284c7);
      color: #0f172a;
      font-weight: 600;
      border: none;
      border-radius: 0.6rem;
      padding: 0.55rem 1rem;
      cursor: pointer;
      font-size: 0.85rem;
      transition: all 0.2s ease;
      white-space: nowrap;
    }

    .copy-btn:hover {
      opacity: 0.95;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
    }

    .copy-btn:active {
      transform: translateY(0);
    }

    /* Grid Features Section */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 1.5rem;
      width: 100%;
      margin-bottom: 4rem;
    }

    @media (min-width: 640px) {
      .features-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .feature-card {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 1.25rem;
      padding: 1.75rem;
      transition: all 0.3s ease;
    }

    .feature-card:hover {
      background: var(--bg-card-hover);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-3px);
    }

    .feature-icon {
      width: 44px;
      height: 44px;
      border-radius: 0.75rem;
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--primary-cyan);
      margin-bottom: 1.25rem;
    }

    .feature-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .feature-desc {
      font-size: 0.9rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    /* Code Snippets Section */
    .code-section {
      width: 100%;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 1.5rem;
      padding: 2rem;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      text-align: center;
    }

    .section-subtitle {
      text-align: center;
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 2rem;
    }

    .tabs {
      display: flex;
      gap: 0.5rem;
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.75rem;
      margin-bottom: 1.25rem;
      overflow-x: auto;
    }

    .tab-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-weight: 600;
      font-size: 0.9rem;
      padding: 0.4rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .tab-btn.active {
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary-cyan);
    }

    .code-block {
      background: #04060a;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 0.85rem;
      padding: 1.25rem;
      font-family: var(--font-mono);
      font-size: 0.85rem;
      color: #e2e8f0;
      overflow-x: auto;
      line-height: 1.6;
    }

    /* Footer */
    footer {
      position: relative;
      z-index: 10;
      border-top: 1px solid var(--border-color);
      padding: 2rem 1.5rem;
      text-align: center;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    footer a {
      color: var(--primary-cyan);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>

  <div class="glow-bg"></div>
  <div class="glow-bg-2"></div>

  <header>
    <a href="#" class="logo-container">
      <div class="logo-badge">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
      </div>
      <span>RoProxy Lite</span>
    </a>
    <div class="status-pill">
      <span class="status-dot"></span>
      Operational
    </div>
  </header>

  <main>
    <section class="hero">
      <div class="hero-tag">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        Cloudflare Workers Edge Network
      </div>
      <h1 class="hero-title">Free, Serverless <span>Roblox API</span> Reverse Proxy</h1>
      <p class="hero-subtitle">High-speed, zero-latency proxy for Roblox developers. Bypass Roblox HttpService domain restrictions seamlessly.</p>
    </section>

    <!-- URL Converter Component -->
    <section class="converter-card">
      <div class="converter-label">
        <span>Try URL Converter</span>
        <span style="font-size: 0.8rem; color: var(--primary-cyan)">Host: ${urlObj.hostname}</span>
      </div>
      <div class="input-group">
        <input 
          type="url" 
          id="robloxUrlInput" 
          class="url-input" 
          placeholder="https://games.roblox.com/v1/games/130582315"
          value="https://games.roblox.com/v1/games/130582315"
        />
        <div class="output-box">
          <span id="convertedUrlText" class="output-text">${hostUrl}/games/v1/games/130582315</span>
          <button id="copyBtn" class="copy-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
            <span>Copy URL</span>
          </button>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <h3 class="feature-title">Global Edge Speed</h3>
        <p class="feature-desc">Powered by Cloudflare Workers isolates running in 300+ edge locations worldwide for minimal latency.</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        </div>
        <h3 class="feature-title">Unrestricted Subdomains</h3>
        <p class="feature-desc">Access any valid Roblox subdomain (games, users, economy, presence, inventory, catalog, groups).</p>
      </div>

      <div class="feature-card">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 class="feature-title">Secure & Clean</h3>
        <p class="feature-desc">Built-in SSRF protection, optional PROXYKEY auth header support, and strict header sanitization.</p>
      </div>
    </section>

    <!-- Code Examples -->
    <section class="code-section">
      <h2 class="section-title">How to Use</h2>
      <p class="section-subtitle">Replace <code style="color:var(--primary-cyan)">roblox.com</code> with your proxy host <code style="color:var(--primary-cyan)">${urlObj.hostname}</code></p>
      
      <div class="tabs">
        <button class="tab-btn active" onclick="switchTab('lua')">Roblox Lua</button>
        <button class="tab-btn" onclick="switchTab('js')">JavaScript (Node/Web)</button>
        <button class="tab-btn" onclick="switchTab('py')">Python</button>
        <button class="tab-btn" onclick="switchTab('curl')">cURL</button>
      </div>

      <pre id="codeSnippet" class="code-block"><code>local HttpService = game:GetService("HttpService")
local url = "${hostUrl}/games/v1/games?universeIds=130582315"

local response = HttpService:GetAsync(url)
local data = HttpService:JSONDecode(response)
print(data)</code></pre>
    </section>
  </main>

  <footer>
    <p>RoProxy Lite — Serverless Cloudflare Worker Proxy | Open Source on <a href="https://github.com/johnmarctumulak/roproxy-lite" target="_blank">GitHub</a></p>
  </footer>

  <script>
    const hostUrl = "${hostUrl}";
    const input = document.getElementById('robloxUrlInput');
    const output = document.getElementById('convertedUrlText');
    const copyBtn = document.getElementById('copyBtn');

    function updateConvertedUrl() {
      const val = input.value.trim();
      if (!val) {
        output.textContent = hostUrl + '/<subdomain>/<path>';
        return;
      }

      try {
        const parsed = new URL(val);
        const hostParts = parsed.hostname.split('.');
        let subdomain = hostParts[0];
        
        const pathAndQuery = parsed.pathname + parsed.search;
        output.textContent = hostUrl + '/' + subdomain + pathAndQuery;
      } catch {
        output.textContent = hostUrl + '/invalid-url-format';
      }
    }

    input.addEventListener('input', updateConvertedUrl);

    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(output.textContent);
      copyBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> <span>Copied!</span>\`;
      setTimeout(() => {
        copyBtn.innerHTML = \`<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg> <span>Copy URL</span>\`;
      }, 2000);
    });

    const snippets = {
      lua: \`local HttpService = game:GetService("HttpService")
local url = "\${hostUrl}/games/v1/games?universeIds=130582315"

local response = HttpService:GetAsync(url)
local data = HttpService:JSONDecode(response)
print(data)\`,
      js: \`const response = await fetch("\${hostUrl}/games/v1/games?universeIds=130582315");
const data = await response.json();
console.log(data);\`,
      py: \`import requests

url = "\${hostUrl}/games/v1/games?universeIds=130582315"
response = requests.get(url)
print(response.json())\`,
      curl: \`curl "\${hostUrl}/games/v1/games?universeIds=130582315"\`
    };

    function switchTab(lang) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('codeSnippet').querySelector('code').textContent = snippets[lang];
    }
  </script>
</body>
</html>`;
}
