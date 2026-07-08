---
name: Port routing in Replit
description: How frontend and API ports map in this project's Replit .replit config
---

The .replit file hard-codes these external port mappings:
- Frontend (Vite): localPort=8080 → externalPort=80
- API (Express): localPort=3000 → externalPort=3002

**Why:** The Replit proxy always routes the user-facing preview to port 80. If frontend ran on 3000 or API on 8080 the app would be invisible or the proxy cookie domain would mismatch.

**How to apply:** Any new workflow command must respect these ports. Vite must bind to 8080, Express to 3000. Never swap them.
