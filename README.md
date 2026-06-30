# SwatchForge v0.1.0 — First Pour

A local-first static GitHub Pages preview for tracking nail-art items, avoiding duplicate buys, watching low-stock supplies, and turning inspo into reusable nail-look recipes.

## What is built

- Items model from the start: polish, base coat, top coat, gel, powder, tools, stickers, charms, decorations, and other supplies.
- Dashboard with stash, low-stock, wishlist, and ready-look counts.
- Add/edit/delete item records.
- Swatch color picker and image upload fields for bottle/swatch photos.
- Item search and filters by type, color family, and finish.
- Low stock/restock tracking.
- Dupe Goblin similarity checker.
- Look Book for tutorials/recipes.
- Look editor with inspo/final image upload fields.
- Tutorial Builder with step editor.
- Requirement types with help panels:
  - Exact Required
  - Similar Allowed
  - Any Color Works
  - Optional
  - Tool Required
- Can-I-Make-This checker with missing/owned/substitution status.
- Possible colorway suggestions.
- Local JSON export/import backup.
- GitHub Pages-ready static files.

## How to run locally

Open `index.html` in a browser, or serve the folder locally for the closest GitHub Pages-style test:

```bash
python -m http.server 8000
```

Then visit:

```txt
http://localhost:8000
```

## Important v0.1 notes

This is intentionally local-first. Data is saved in browser localStorage. Images are stored as data URLs inside the local browser data and backup JSON. That is fine for early testing, but a later version should move images to IndexedDB or cloud storage.

## Recommended first testing pass

1. Add a new polish.
2. Add a non-polish item such as chrome powder, a nail brush, or rhinestones.
3. Mark something Low and Restock.
4. Create a new look.
5. Add steps in Tutorial Builder.
6. Try different requirement types.
7. Check whether the look is ready to make.
8. Export a backup.
9. Reset demo data.
10. Import the backup.

## Next likely versions

- v0.1.1: bugfix pass after phone testing.
- v0.2.0: stronger tutorial builder UX.
- v0.3.0: better substitution and variation logic.
- v0.4.0: stronger duplicate scoring and item comparison.
- v0.5.0: printable/exportable recipe cards.


## GitHub Pages Preview Build

This version is meant to run as a normal static GitHub Pages site, not as an installable PWA.

### Upload option A: repository root

1. Create a new GitHub repository, for example `swatchforge`.
2. Upload the contents of this folder, not the folder itself. `index.html` should be at the repo root.
3. Go to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select the `main` branch and `/root`, then save.
6. Open the GitHub Pages URL once it finishes deploying.

### Upload option B: docs folder

1. Put this entire app inside a `/docs` folder in an existing repo.
2. Go to **Settings → Pages**.
3. Select the `main` branch and `/docs`, then save.

### Notes

- This build intentionally has **no manifest** and **no active service worker registration** so it should not prompt to install or aggressively cache old files.
- Data is still saved locally in the browser using the current device/browser storage.
- Use **Settings → Export Backup** before clearing browser data or switching devices.
- For quick testing, open the GitHub Pages link on her phone and add it to the home screen manually only if desired; it will still act like a regular website.
