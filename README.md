# SwatchForge — A Gilded & Pressed Nail Studio

## v1.0 GitHub-hosted shared-studio preview

This branch replaces the old per-browser localStorage prototype with the **Witchy Corpo** visual design from the Google Apps Script app. The frontend is an installable PWA hosted by GitHub Pages. The shared API runs on Cloudflare Workers, with **D1** for records and **R2** for private photos.

**Deployment status:** Source code is ready for review. The shared API is **not yet deployed or connected**, and the live GitHub Pages site on `main` remains unchanged. Do not merge this branch expecting saving to work until the backend checklist is complete.

### Why the backend changed

GitHub Pages cannot securely hold a Google service-account key or write private Google Sheets directly. The current backend uses Cloudflare D1/R2 rather than the studio's Google Sheet/Drive. This means **existing Google Apps Script data is NOT automatically connected**. If you want Google storage specifically, we should add an authenticated Google connector and a migration path before swapping out the existing data.

Because Bloo and Phoenixx had not been able to populate a working shared inventory, this first preview assumes an empty database. Do not delete your existing Google Sheet or Drive folder.

## Included features

- Bloo / Phoenixx studio login (separate long passphrases)
- Shared studio inventory with owner protection on edits and deletes
- Shared shopping ledger
- Shared recipe book, with illustrated steps and product requirement types
- Private image upload and download via R2
- Print / Save as PDF via browser preview
- Server-confirmed saves, visible errors, and refresh
- Witchy Corpo colors, mobile layout, installable manifest

**Not yet built:** a true automatic dupe scoring engine, barcode scanner, advanced substitutions, loan tracking, or Google Sheets synchronization.

## Set up backend (Cloudflare)

You need a Cloudflare account with Workers, D1, and R2 access. These steps are completed by the account owner, **not** by Bloo/Phoenixx.

1. Install Node.js. From the `backend` folder, run `npm install` (or `npx wrangler`).
2. Sign in: `npx wrangler login`.
3. Create database: `npx wrangler d1 create swatchforge-studio`.
4. Copy the returned database ID into `backend/wrangler.toml`.
5. Create photo storage: `npx wrangler r2 bucket create swatchforge-photos`.
6. Create tables: `npx wrangler d1 execute swatchforge-studio --remote --file=./schema.sql`.
7. Add **three secrets** from your local terminal, never the GitHub repo:
   - `npx wrangler secret put BLOO_PASSWORD`
   - `npx wrangler secret put PHOENIXX_PASSWORD`
   - `npx wrangler secret put SESSION_SECRET`
   Use different long random passphrases for the two members. `SESSION_SECRET` should be another independent random secret (at least 32 bytes).
8. `npx wrangler deploy` from `backend`.
9. Copy the deployed HTTPS Worker URL into **`studio-config.js`**, as `window.SWATCHFORGE_API_URL`. This URL is public; **never paste secrets into it**.
10. Commit the config change, merge the PR, and confirm GitHub Pages is publishing `main` from the repository root.

Cloudflare R2 may require enabling billing. Check your Cloudflare plan before creating storage.

### Verify

- Open the deployed Worker URL with `/api/health` appended. It should return JSON containing `"ok":true`.
- Open GitHub Pages in a private browser window and log in as Bloo.
- Create **TEST POLISH** with no photo. Confirm **Saved successfully**, refresh, and verify it persists.
- Log in as Phoenixx on another device. Confirm the same item appears.
- Try a recipe, a shopping item, and a small photo.
- Test printing a recipe with a step photo.

### Security and sharing

- GitHub Pages is publicly viewable; **records and photos require a studio token**.
- Profiles are separate, and inventory edits are limited to the item's owner.
- The API rate-limits failed studio login attempts per source IP/profile.
- Protect Cloudflare access and keep secrets only in Wrangler secrets.
- Custom password login is intended for a **small private beta**, not a publicly sold multi-tenant SaaS. Use managed authentication before scaling.

## Editing and rollback

The prior GitHub Pages prototype remains in Git history. The current production site stays unchanged until this branch is merged. You can continue using the Apps Script deployment as a reference; it is not modified by this branch.
