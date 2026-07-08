---
name: Artifact missing BASE_PATH/PORT env block
description: A react-vite (or similar) artifact's vite.config.ts requires BASE_PATH and PORT env vars, but the auto-generated artifact.toml sometimes lacks the [services.env] block, causing the dev workflow to crash on startup.
---

If a web artifact's workflow fails immediately with "BASE_PATH environment variable is required but was not provided" (or similar for PORT), check `.replit-artifact/artifact.toml` for a missing `[services.env]` block under `[[services]]`.

**Why:** Some sibling artifacts get this block auto-populated correctly; others (observed with a react-vite artifact created after manual restoration from a zip/backup) do not, and vite.config.ts throws at startup without it.

**How to apply:** Never edit artifact.toml directly. Copy the full existing TOML to a sibling `artifact.edit.toml`, add:
```
[services.env]
PORT = "<the service's localPort as a string>"
BASE_PATH = "/"  # or the artifact's previewPath
```
Then call `verifyAndReplaceArtifactToml({tempFilePath, artifactTomlPath})` and restart the workflow.
