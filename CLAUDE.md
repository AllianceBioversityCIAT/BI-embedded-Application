# CLAUDE.md — Working context (BI-embedded-Application)

> Last session: **2026-06-09**. Branch: `staging`.
> Status: **SW v1 (in-RAM Map) shipped to prod and FAILED in all browsers. Two REAL bugs found and fixed (Cache API + claim). Re-validated in a real browser (Firefox, embedded). NOT committed, NOT deployed yet.**

---

## 🛑 POSTMORTEM — why the v1 fix broke the download EVERYWHERE (2026-06-09)

**Symptom reported by Manuel Almanzar:** it no longer exports in any browser.
- Chrome/Edge: `"File wasn't available on site"` (404).
- Firefox: downloads a file Excel can't open (`"file format or file extension is not valid"`).

**Root cause #1 (confirmed):** `sw.js` stored the file in an **in-memory `Map` (`FILES`)**.
The browser **terminates the Service Worker** between the `postMessage` (which stores the buffer) and the download click's `fetch`. When the worker restarts, the `Map` starts empty → `FILES.get(id)` is `undefined` → the handler **does not call `respondWith`** → the request falls through to the network → CloudFront returns **404** (verified: `/__dl__/<anything>` → 404, NO SPA fallback). Hence "not available" in Chrome and the corrupt file in Firefox.

> ⚠️ The v1 Playwright harness did NOT catch it because there the worker stayed warm. In prod it gets killed. **Lesson: a SW must NOT rely on in-RAM state surviving between events.**

**Root cause #2 (Firefox embedded — found by reproducing it PROPERLY):** even after fixing the Map, in **Firefox** the SW **does not control a cross-origin iframe on recurring loads**. It only controls it the first time (fresh install) because `clients.claim()` runs in `activate` (which runs only once). On reloads/return visits `navigator.serviceWorker.controller` stays `null` → the `fetch` to `/__dl__/` is NOT intercepted → falls through to the network → fails. Since Manuel already had the SW installed, it failed for him every time. **A Chromium-only harness does NOT catch this because Chrome DOES auto-control the iframe on reload; it's Firefox-specific.**

**Fix (v2 — both bugs):**
1. **Cache API:** `sw.js` stores the file in `caches.open('dl-files')` (persists even if the worker is killed), sends the `ready` ack **after** storing, and `fetch` **always** calls `respondWith` for `/__dl__/` (serve from cache, or a clean 404 — never falls through to the network).
2. **Claim on every load:** the client (`sw-download.service.ts` `getController`) asks the active SW `{type:'claim'}` and waits for `controllerchange`; `sw.js` responds with `self.clients.claim()`. This way the iframe stays controlled in Firefox on recurring loads too.

**Re-validated (2026-06-09) in REAL FIREFOX, embedded in a cross-origin same-site iframe, with a `frame-src` CSP WITHOUT `blob:`, on the RELOAD path (the one that failed):**
- Old `blob:` path → **blocked** by CSP (original bug reproduced — harness is valid).
- SW v2 fix → **downloads ✅**, `controller: YES` after claim, file **byte-exact** vs reference (16122 bytes), starts with `PK` (valid xlsx).
- `npm run build` OK; `sw.js` with `claim` + Cache API confirmed in `dist/bi-client/browser/sw.js`.
- Harness: `/tmp/sw-dl-test/` (real `sw.js` + `run-ff.js` Playwright-Firefox + `front.html` + `reference.xlsx`).

---

## 🎯 MAIN TASK: Excel download bug in Firefox (SOLVED)

### The report
- **Who:** Manuel Ricardo Almanzar (BI Analyst) reported it via Jira; Santiago Sánchez relayed it on Slack.
- **Symptom:** In the **Results Dashboard**, the "Result details" table has an **"Export data (Excel file)"** button. In **Firefox it does NOT download** the Excel (stuck on "Generating the file..."). In **Chrome/Edge it WORKS**.
- **Where:** https://www.cgiar.org/food-security-impact/results-dashboard (public production, no login).

### ✅ ROOT CAUSE (confirmed)
A **Content-Security-Policy (CSP)** block from the container site, NOT a bug in the front-end logic itself.

**Exact mechanism:**
1. User clicks "Export data (Excel file)" (a Power BI *action button* that applies a bookmark).
2. The **front** (`bi.prms.cgiar.org`) listens for `bookmarkApplied`, asks Power BI for the data via `visual.exportData()` (async, takes seconds), builds the Excel with `xlsx`, and creates a `blob:https://bi.prms.cgiar.org/...`.
3. `FileSaver.saveAs()` tries to materialize the download. In **Firefox**, inside the embedded iframe, the browser tries to open the `blob:` as a **frame** instead of downloading it.
4. The host page **`www.cgiar.org` (Cloudflare)** ships a CSP whose `frame-src` does **NOT include `blob:`** → Firefox blocks it.
5. Chrome/Edge are more lenient → they download via `<a download>` without creating a frame.

### Architecture (verified live)
```
www.cgiar.org/.../results-dashboard               ← host (Cloudflare, sets the CSP)
  └─ bi.prms.cgiar.org/bi/cgiar-results-dashboard ← your Angular front (iframe, no sandbox)
      └─ app.powerbi.com/reportEmbed?...          ← Power BI (Microsoft, cross-origin)
```
> Note: `www.cgiar.org` and `bi.prms.cgiar.org` are the **same site** (eTLD+1 = `cgiar.org`). This matters for the fix (no third-party storage partitioning).

---

## ✅ SOLUTION IMPLEMENTED: Service Worker download (front-only)

Instead of a `blob:`, a **Service Worker** serves the file from a **real same-origin `https://` URL** (`/__dl__/<id>`) with `Content-Disposition: attachment`. A real URL is **never checked against `frame-src`**, so it downloads in Firefox embedded, in every browser, and in any container — **without touching the backend or asking CGIAR to change their CSP.**

### Files changed (all under `bi-client/`)
| File | Change |
|---|---|
| `src/sw.js` | **NEW.** The download Service Worker (receives the buffer via `postMessage`, serves it as an attachment from `/__dl__/<id>`). |
| `src/app/services/sw-download.service.ts` | **NEW.** Registers the SW and downloads through it; **falls back to `FileSaver`** when there is no SW support. |
| `src/app/services/export-tables.service.ts` | Replaced direct `FileSaver.saveAs` with `SwDownloadService.download(...)`. Also fixed `exportExcel` to actually `await` the download (it didn't before). |
| `src/main.ts` | Registers `/sw.js` on bootstrap so it controls the page before the user clicks Export. |
| `angular.json` | Copies `sw.js` to the build **root** (`output: "/"`) so it ships as `bi.prms.cgiar.org/sw.js` with scope `/`. |

### ⚠️ CRITICAL detail (bug caught during validation)
The SW MUST be registered with an **absolute path `/sw.js`**, NOT relative `'sw.js'`.
The dashboard loads at `/bi/cgiar-results-dashboard` (route `bi/:reportName`), so a relative `'sw.js'` resolves to `/bi/sw.js` → **404** → registration fails → silent fallback to the blocked `blob:`. Both `main.ts` and `sw-download.service.ts` use `/sw.js`.

---

## ❌ What was ruled out (proven empirically, do not retry)
- **Front-end with `blob:` or `data:` URLs** (anchor `<a download>`, with or without preserving user-activation). ALL blocked by `frame-src` in Firefox. The original diagnosis blamed lost user-activation; that was wrong — it is the CSP blocking the `blob:`/`data:` scheme directly, gesture or not.
- **WASM (Go) Excel generation.** Doesn't help: the problem is *delivery*, not *generation*. WASM still ends up creating a blocked `blob:`. (Likely why the WASM commit `39881e0` was reverted in `248c2db`.)

---

## 🧪 VALIDATION (Playwright + real Firefox, headless)

Reproduction harness lives in `/tmp/ff-export-repro/` (Python servers + 7 combos + runners). It mirrors the real CSP and the real service flow.

- **Bug reproduced:** `blob:`/`data:` → blocked with the exact same console error as production.
- **7 combinations tested:** only the 3 Service Worker variants (anchor / hidden iframe / `window.location`) download. All `blob:`/`data:` variants fail.
- **Cross-origin same-site:** SW downloads under **Release default (dFPI), ETP Strict, private browsing, and `cookieBehavior=1`**. All ✅.
- **Worst case (cross-SITE + total third-party storage block):** SW fails (`"operation is insecure"`) — **does NOT apply here** because front and host are the same site (`cgiar.org`).
- **Real artifact test:** built `sw.js` served from the real `/bi/...` subpath, embedded cross-origin with the CSP → registered (`scope=/`, `script=/sw.js`) and **downloaded in all 3 privacy profiles**.

> ⚠️ Final manual check still recommended in production: the Power BI action button can't be reliably automated, so the deploy is the ultimate test. Validate in Firefox at:
> - Embedded: `https://www.cgiar.org/food-security-impact/results-dashboard` → should download ✅
> - Direct: `https://bi.prms.cgiar.org/bi/cgiar-results-dashboard` → should download ✅

---

## ☁️ AWS / DEPLOY notes for this fix

**No deploy-process change required. Just rebuild and deploy as usual.**
- **Content-Type:** verified that `aws s3 cp` tags `sw.js` as `text/javascript` (valid for a Service Worker). Nothing to force.
- **CloudFront invalidation:** the deploy scripts already do `create-invalidation /*` → the new `sw.js` is served fresh.
- **HTTPS:** prod is HTTPS → secure context for the SW. ✅
- **No CSP / no `Service-Worker-Allowed` header needed:** the SW is at root `/sw.js` with scope `/`; the `/__dl__/` path is intercepted by the SW and never reaches CloudFront.
- **Minor, future:** consider a short `Cache-Control` (e.g. `no-cache`) on `sw.js` for future SW updates. Not blocking now (deploy invalidates `/*`).
- **Post-deploy check:** `curl -I https://bi.prms.cgiar.org/sw.js` → expect `200` + `content-type: text/javascript`.

**Recommendation:** deploy to TEST first (`ups3-test.bash` → `prmsbitest`) and verify the embedded flow in Firefox before PROD.

---

## 🚀 STEP-BY-STEP DEPLOY (run when Yeck says "deploy to test/prod")

Deploy is **manual** to S3 + CloudFront. Two environments. **Before deploying, set the API URL in the matching Angular env file** (this project has no `.env`; the URL lives in `environment*.ts`).

**Which env file each build uses:**
- `npm run build` (PROD) → `src/environments/environment.ts`
- `npm run build-dev` (TEST) → `src/environments/environment.development.ts` (via `fileReplacements` in `angular.json`)

### ▶️ Deploy to TEST (bucket `prmsbitest`)
1. **Set the TEST URL** in `src/environments/environment.development.ts`:
   `apiBaseUrl: 'https://prtest-back.ciat.cgiar.org/'` (that line is currently commented and points to prod — switch it for a real test deploy).
2. From `bi-client/`:
   ```bash
   npm run build-dev   # must succeed before touching S3
   aws configure set aws_access_key_id <TEST_KEY>
   aws configure set aws_secret_access_key <TEST_SECRET>
   aws s3 rm s3://prmsbitest --recursive
   aws s3 cp ./dist/bi-client/browser s3://prmsbitest --recursive
   aws cloudfront create-invalidation --distribution-id EP88WI2A7Y64L --paths "/*"
   ```
   (or `bash scripts/ups3-test.bash`)

### ▶️ Deploy to PROD (bucket `prmsbi.cgiar.org` → `bi.prms.cgiar.org`)
1. **Set the PROD URL** in `src/environments/environment.ts`:
   `apiBaseUrl: 'https://api.reporting.cgiar.org/'` (correct by default).
2. From `bi-client/`:
   ```bash
   npm run build       # must succeed before touching S3
   aws configure set aws_access_key_id <PROD_KEY>
   aws configure set aws_secret_access_key <PROD_SECRET>
   aws s3 rm s3://prmsbi.cgiar.org --recursive
   aws s3 cp ./dist/bi-client/browser s3://prmsbi.cgiar.org --recursive
   aws cloudfront create-invalidation --distribution-id E2ML5GGN44H8C2 --paths "/*"
   ```
   (or `bash scripts/ups3-prod.bash`)

> ⚠️ The scripts have NO `set -e`: if `npm run build` fails, the script still runs `aws s3 rm` and **wipes the bucket**. Always confirm the build succeeded before the `rm`/`cp` step.

### ✅ Post-deploy check
```bash
curl -I https://bi.prms.cgiar.org/sw.js                # expect 200 + content-type: text/javascript
curl -I https://bi.prms.cgiar.org/assets/go/main.wasm  # expect 200 + application/wasm
```
Then open the embedded page in **Firefox** and click "Export data" to confirm the download works.

---

## 🚀 HOW IT DEPLOYS (manual deploy to S3 + CloudFront)

Deploy is **NOT** in GitHub Actions. `release.yml` only runs `semantic-release` (versioning + npm + GitHub release), it does not deploy.

Real deploy is **manual**, via scripts in `bi-client/scripts/` (**gitignored** — `.gitignore:48 /scripts`, comment "scripts to deploy to S3"):

- **`ups3-test.bash`** (TEST):
  ```bash
  npm run build-dev
  aws s3 rm s3://prmsbitest --recursive
  aws s3 cp ./dist/bi-client/browser s3://prmsbitest --recursive
  aws cloudfront create-invalidation --distribution-id EP88WI2A7Y64L --paths "/*"
  ```
- **`ups3-prod.bash`** (PROD):
  ```bash
  npm run build
  aws s3 rm s3://prmsbi.cgiar.org --recursive
  aws s3 cp ./dist/bi-client/browser s3://prmsbi.cgiar.org --recursive
  aws cloudfront create-invalidation --distribution-id E2ML5GGN44H8C2 --paths "/*"
  ```
- Angular build → `dist/bi-client/browser` (`angular.json` `outputPath: dist/bi-client`).
- PROD bucket `prmsbi.cgiar.org` = origin of `bi.prms.cgiar.org` (CloudFront).

## 🚨 SECURITY PENDING (URGENT — unresolved)
Both deploy scripts have **hardcoded AWS credentials in plaintext** (`aws configure set aws_access_key_id/secret`):
- PROD Access Key ID: `AKIAVFZQUQAISNVV4ZWG`
- TEST Access Key ID: `AKIAYJAOTOYEVKSCOFWH`

**Recommended actions (not done yet, awaiting Yeck's OK):**
1. **Rotate/revoke both keys in IAM** (most urgent — they were exposed on disk and in chat).
2. Migrate scripts to an AWS profile (`aws configure --profile prms` + `--profile prms` in commands), no secrets in the file.
3. IAM least-privilege (only that bucket + that distribution).

---

## 📁 Key front-end files
- `bi-client/src/sw.js` — download Service Worker (the fix).
- `bi-client/src/app/services/sw-download.service.ts` — SW registration + download with FileSaver fallback.
- `bi-client/src/app/services/export-tables.service.ts` — builds the Excel (`xlsx`) and delegates download to `SwDownloadService`.
- `bi-client/src/app/services/bi-implementation.service.ts` — `exportButton()` / `detectButtonAndTable()` (~lines 252-312): listens for `bookmarkApplied`, calls `visual.exportData()`, then `exportExcel()`.
- `bi-client/src/main.ts` — registers `/sw.js` on bootstrap.
- `bi-client/src/environments/environment.development.ts` — `apiBaseUrl`.
- `bi-client/scripts/ups3-*.bash` — deploy (gitignored).
