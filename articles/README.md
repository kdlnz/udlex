Generating search JSON files

This project includes a small Node script to generate per-article JSON files used by the client-side search UI.

Usage:

1. Install Node.js (v16+ recommended).
2. From the repo root run:

   node scripts/generate-search-json.js

This will read `articles/articles.json` and write individual JSON files into `articles/search/` plus `articles/search/index.json` which the search UI can consume.

If you don't have Node available, you can still update `articles/search/` manually or run the script in an environment that has Node installed.

PowerShell alternative (Windows)

If Node is not available, a PowerShell script is included. From the repo root run:

  .\scripts\generate-search-json.ps1

To parse article HTML files instead of using `articles/articles.json` use:

  .\scripts\generate-search-json.ps1 -FromHtml

If you don't have Node available, you can still update `articles/search/` manually or run the script in an environment that has Node installed.
