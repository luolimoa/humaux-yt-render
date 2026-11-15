# humaux-yt-render

Render-only repo for Humaux YouTube videos, built with huashu-motion.

Why this repo exists: the local VM's Hatch Chromium cannot start
(WebGL domain policy is not mounted into the runtime cell), so rendering
runs on GitHub-hosted runners instead, where Chrome is available.

Contents:

- `humaux-yt-001-welcome/` — YouTube ①《Welcome to Humaux》 project
  (index.html, vendor JS, voiceover, fonts). Binary assets are stored
  base64-encoded (`*.b64`) so pushes stay UTF-8; the workflow decodes
  them and verifies sha256 before rendering.
- `.github/workflows/render-yt-001.yml` — pins huashu-motion at commit
  `3e92780`, runs `om sound → check → render --workers 1 → qa`,
  uploads the mp4 as artifact `yt-001-welcome`, and files an issue
  reporting the run outcome with a link to the run.

Trigger: push to `main`, or manual dispatch from the Actions tab.
The mp4 artifact is downloaded from the run's page.
