---
name: Cookie auth via Vite proxy
description: Vite proxy config pitfall that breaks session cookies in Replit
---

Removing `cookieDomainRewrite` from the Vite proxy config was required for cookie-based auth to work from the Replit-proxied domain (*.replit.dev / *.repl.co).

**Why:** `cookieDomainRewrite` rewrites Set-Cookie domain headers; when the browser hits the app via an external Replit hostname the rewritten domain doesn't match and cookies are silently dropped.

**How to apply:** In vite.config.ts, the /api proxy entry must NOT include `cookieDomainRewrite`. Keep `changeOrigin: true` and `secure: false` but omit the rewrite.
