import { state, persist, uid, today } from './state.js';
import { exportData, importDataFromFile, resetData } from './storage.js';
import { ITEM_TYPES, COLOR_FAMILIES, FINISHES, OPACITIES, AMOUNTS, OWNED_STATUSES, DIFFICULTIES, VISIBILITIES, REQUIREMENT_TYPES, TECHNIQUE_ROLES } from './data/option-lists.js';
import { emptyItem, emptyLook, emptyStep } from './schema.js';
import { escapeHtml, optionTags, tagsToString, stringToTags, helpPanel, readImageAsDataUrl } from './components/helpers.js';
import { itemCard, lookCard } from './components/cards.js';
import { filterItems, findItem, lowStockItems, wishlistItems, itemLabel } from './logic/itemLogic.js';
import { dupeWarningsForItem, allDupeGroups } from './logic/dupeLogic.js';
import { evaluateLook, possibleVariations, stepsForLook } from './logic/lookLogic.js';

const app = document.querySelector('#app');
const helpDialog = document.querySelector('#helpDialog');
const helpContent = document.querySelector('#helpContent');
const toast = document.querySelector('#toast');
const showHelp = () => state.data.settings?.showHelpPanels !== false;

const reqHelpHtml = () => `
  <div class="help-list">
    ${REQUIREMENT_TYPES.map(type => `<div><strong>${type.value}</strong><span>${type.meaning}</span></div>`).join('')}
  </div>`;

const opacityHelpHtml = () => `
  <div class="help-list">
    <div><strong>Finish</strong><span>What the polish looks like: jelly, creme, shimmer, chrome, glitter, topper, etc.</span></div>
    <div><strong>Opacity</strong><span>How much it covers: one-coat opaque, two-coat opaque, sheer/buildable, topper only, clear, etc.</span></div>
    <div><strong>Tags</strong><span>Use commas between tags. Example: <span class="kbd">glass, jelly, wedding, chrome</span>. Multiple tags go in the same box.</span></div>
  </div>`;

function showToast(message) {
  if (!toast) return alert(message);
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2200);
}

function navigate(route, params = {}) {
  state.route = route;
  state.params = params;
  history.pushState({ route, params }, '', `#${route}${params.id ? `/${params.id}` : ''}`);
  render();
}

function setActiveTab() {
  document.querySelectorAll('.tab').forEach(tab => {
    const base = ['add-item','edit-item','item-detail'].includes(state.route) ? 'items' : ['add-look','edit-look','look-detail','tutorial-builder','can-i-make'].includes(state.route) ? 'looks' : state.route;
    tab.classList.toggle('active', tab.dataset.route === base);
  });
}

function render() {
  setActiveTab();
  const routes = {
    home: renderHome,
    items: renderItems,
    'item-detail': renderItemDetail,
    'add-item': () => renderItemForm(),
    'edit-item': () => renderItemForm(state.params.id),
    looks: renderLooks,
    'look-detail': renderLookDetail,
    'add-look': () => renderLookForm(),
    'edit-look': () => renderLookForm(state.params.id),
    'tutorial-builder': renderTutorialBuilder,
    dupes: renderDupes,
    settings: renderSettings
  };
  app.innerHTML = (routes[state.route] || renderHome)();
  app.focus();
}

function renderHome() {
  const itemCount = state.data.items.length;
  const lowCount = lowStockItems(state.data).length;
  const wishlistCount = wishlistItems(state.data).length;
  const readyLooks = state.data.looks.filter(look => evaluateLook(state.data, look.id).ready).length;
  return `
    <section class="card hero">
      <h2>Daykeeper Theme Preview</h2>
      <p>A softer Daykeeper-style skin with cozy cards, lighter colors, and a prettier little notebook vibe — while keeping all the stash, look, and backup logic intact.</p>
      <div class="actions">
        <button class="button" data-route="add-item">💅 Add Item</button>
        <button class="ghost" data-route="add-look">✨ Create Look</button>
      </div>
    </section>
    <section class="grid auto" style="margin-top:1rem">
      ${statCard(itemCount, '💅 Items in stash', 'items')}
      ${statCard(lowCount, '🛒 Low / restock items', 'items', 'Low')}
      ${statCard(wishlistCount, '💖 Wishlist items', 'items', 'Wishlist')}
      ${statCard(readyLooks, '🪄 Looks ready to make', 'looks')}
    </section>
    <section class="grid two" style="margin-top:1rem">
      <article class="card">
        <h2>💅 The Item Model Is Live</h2>
        <p>Polish, top coat, base coat, powder, tools, charms, stickers, decorations — all tracked as <strong>items</strong>. Polish is just one type, like a civilized little lacquer citizen.</p>
        <div class="actions"><button class="ghost" data-route="items">Open My Stash</button></div>
      </article>
      <article class="card notice">
        <h2>🫶 Requirement Help Built In</h2>
        <p>Requirement types are available in the global help and inside look/tutorial screens, so they can pick “Exact Required,” “Similar Allowed,” “Optional,” and the rest without guessing.</p>
        <div class="actions"><button class="ghost" id="inlineHelpButton">Show Help</button></div>
      </article>
    </section>`;
}

function statCard(number, label, route, quickFilter = '') {
  return `<button class="card stat-card" data-route="${route}" data-quick-filter="${quickFilter}" style="text-align:left;border:1px solid var(--line)"><strong>${number}</strong><span>${label}</span></button>`;
}

function activeItemFilterNotice() {
  const active = [];
  if (state.filters.lowOnly) active.push('Low/restock only');
  if (state.filters.status && state.filters.status !== 'All') active.push(`Status: ${state.filters.status}`);
  if (state.filters.itemType !== 'All') active.push(`Type: ${state.filters.itemType}`);
  if (state.filters.colorFamily !== 'All') active.push(`Family: ${state.filters.colorFamily}`);
  if (state.filters.finish !== 'All') active.push(`Finish: ${state.filters.finish}`);
  if (state.filters.itemSearch) active.push(`Search: ${state.filters.itemSearch}`);
  if (!active.length) return '';
  return `<section class="card notice" style="margin-bottom:1rem"><strong>Active filter:</strong> ${active.map(escapeHtml).join(' · ')} <button class="ghost" id="clearItemSearch" type="button" style="margin-left:.5rem">Clear filters</button></section>`;
}

function renderItems() {
  const items = filterItems(state.data.items, state.filters);
  return `
    <section class="split">
      <div><h2>💅 My Stash</h2><p class="muted">Track every polish, tool, powder, charm, sticker, and top coat in one pretty little stash.</p></div>
      <button class="button" data-route="add-item">💅 Add Item</button>
    </section>
    ${activeItemFilterNotice()}
    ${helpPanel('What counts as an item?', `<p>An item is anything used to create a look: polish, base coat, top coat, gel, chrome powder, nail art brush, magnet wand, rhinestones, stickers, decals, charms, or supplies.</p>`, showHelp())}
    <section class="card filterbar">
      <div class="row">
        <input id="itemSearch" placeholder="Search brand, color, code, barcode, tag…" value="${escapeHtml(state.filters.itemSearch)}" />
        <select id="itemTypeFilter"><option>All</option>${optionTags(ITEM_TYPES, state.filters.itemType)}</select>
        <select id="familyFilter"><option>All</option>${optionTags(COLOR_FAMILIES, state.filters.colorFamily)}</select>
        <select id="finishFilter"><option>All</option>${optionTags(FINISHES, state.filters.finish)}</select>
      </div>
      <div class="actions">
        <select id="statusFilter" aria-label="Owned status filter"><option>All</option>${optionTags(OWNED_STATUSES, state.filters.status)}</select>
        <label style="display:flex;align-items:center;gap:.45rem;font-weight:850"><input id="lowOnlyFilter" type="checkbox" ${state.filters.lowOnly ? 'checked' : ''} style="width:auto" /> Low/restock only</label>
        <button class="ghost" id="applyItemSearch" type="button">Apply Search</button>
        <button class="ghost" id="clearItemSearch" type="button">Clear</button>
      </div>
      <p class="field-help">Tip: type your search, then tap <strong>Apply Search</strong>. This keeps the phone keyboard from vanishing after one letter.</p>
    </section>
    <section class="grid auto">${items.length ? items.map(itemCard).join('') : '<div class="card empty-state">No matching items. The stash goblin found dust.</div>'}</section>`;
}

function renderItemDetail() {
  const item = findItem(state.data, state.params.id);
  if (!item) return `<div class="card empty-state">Item not found.</div>`;
  const dupes = dupeWarningsForItem(item, state.data.items);
  return `
    <section class="split">
      <div><h2>${escapeHtml(item.itemName)}</h2><p class="muted">${escapeHtml(item.brand)} ${item.collection ? `· ${escapeHtml(item.collection)}` : ''}</p></div>
      <div class="actions"><button class="ghost" data-route="edit-item" data-id="${item.id}">Edit</button><button class="danger" data-action="delete-item" data-id="${item.id}">Delete</button></div>
    </section>
    <section class="grid two">
      <article class="card">
        <div class="thumb">${item.swatchPhoto ? `<img src="${item.swatchPhoto}" alt="Swatch">` : 'Swatch Photo'}</div>
        <hr>
        <div class="badges"><span class="badge accent">${escapeHtml(item.productType)}</span><span class="badge">${escapeHtml(item.colorFamily)}</span><span class="badge">${escapeHtml(item.finish)}</span><span class="badge">${escapeHtml(item.amountLeft)}</span></div>
      </article>
      <article class="card">
        <h3>Details</h3>
        ${detailRow('Color code', item.colorCode)}${detailRow('Barcode', item.barcode)}${detailRow('Opacity', item.opacity)}${detailRow('Special effect', item.specialEffect)}${detailRow('Owner', item.owner)}${detailRow('Visibility', item.visibility)}${detailRow('Status', item.ownedStatus)}${detailRow('Tags', tagsToString(item.tags))}
        <h3>Notes</h3><p>${escapeHtml(item.notes || 'No notes yet.')}</p>
      </article>
    </section>
    <section class="card" style="margin-top:1rem"><h2>👯 Possible Dupes / Similar Items</h2>${dupes.length ? dupeList(dupes) : '<p class="muted">No strong dupe warnings.</p>'}</section>`;
}

function detailRow(label, value) { return `<p><strong>${label}:</strong> ${escapeHtml(value || '—')}</p>`; }

function dupeList(warnings) {
  return `<div class="warning-list">${warnings.map(w => `<div class="card"><strong>${escapeHtml(itemLabel(w.item))}</strong><br><span class="badge warn">Score ${w.score}</span><p class="muted">${escapeHtml(w.reasons.join(' · '))}</p></div>`).join('')}</div>`;
}

function renderItemForm(id) {
  const isEdit = Boolean(id);
  const item = isEdit ? findItem(state.data, id) : emptyItem();
  if (!item) return `<div class="card empty-state">Item not found.</div>`;
  const dupes = dupeWarningsForItem(state.data.items.filter(i => i.id !== item.id), item);
  return `
    <section><h2>${isEdit ? '🖊️ Edit Item' : '💅 Add Item'}</h2><p class="muted">Start with the basic record. Open “More details” only when you need codes, barcode, owner, or extra catalog info.</p></section>
    ${helpPanel('Quick field help', opacityHelpHtml(), showHelp())}
    <form class="card form-grid" id="itemForm">
      <label>Item Type<select name="productType">${optionTags(ITEM_TYPES, item.productType)}</select></label>
      <label>Brand<input name="brand" value="${escapeHtml(item.brand)}" /></label>
      <label class="full">Item / Color Name<input name="itemName" required value="${escapeHtml(item.itemName)}" placeholder="Bubble Bath, Silver Chrome Powder, Detail Brush…" /></label>
      <label>Color Family<select name="colorFamily">${optionTags(COLOR_FAMILIES, item.colorFamily)}</select></label>
      <label>Finish<select name="finish">${optionTags(FINISHES, item.finish)}</select><span class="field-help">Look/texture: creme, jelly, glitter, chrome, shimmer, topper, etc.</span></label>
      <label>Opacity<select name="opacity">${optionTags(OPACITIES, item.opacity || 'Unknown')}</select><span class="field-help">Coverage level, not the visual finish.</span></label>
      <label>Amount Left<select name="amountLeft">${optionTags(AMOUNTS, item.amountLeft)}</select></label>
      <label>Owned Status<select name="ownedStatus">${optionTags(OWNED_STATUSES, item.ownedStatus)}</select></label>
      <label class="full"><input type="checkbox" name="restock" ${item.restock ? 'checked' : ''} /> Add to restock list</label>
      <label class="full">Tags, comma-separated<input name="tags" placeholder="glass, jelly, wedding, chrome" value="${escapeHtml(tagsToString(item.tags))}" /><span class="field-help">Yes: put commas between tags. Multiple tags go in this one box.</span></label>
      <label class="full">Notes<textarea name="notes">${escapeHtml(item.notes)}</textarea></label>
      <label>Bottle / Item Photo<input name="bottlePhotoFile" type="file" accept="image/*" /></label>
      <label>Swatch / Example Photo<input name="swatchPhotoFile" type="file" accept="image/*" /></label>

      <details class="details-card">
        <summary>More details / catalog fields</summary>
        <div class="form-grid" style="margin-top:.9rem">
          <label>Collection<input name="collection" value="${escapeHtml(item.collection)}" /></label>
          <label>Color Code<input name="colorCode" value="${escapeHtml(item.colorCode)}" /></label>
          <label>Barcode<input name="barcode" value="${escapeHtml(item.barcode)}" /></label>
          <label>Special Effect<input name="specialEffect" placeholder="Magnetic, glow, iridescent…" value="${escapeHtml(item.specialEffect)}" /></label>
          <label>Hex / Swatch Color<input name="hexEstimate" type="color" value="${escapeHtml(item.hexEstimate || '#d99aaa')}" /></label>
          <label>Owner<input name="owner" value="${escapeHtml(item.owner || state.data.settings.activeOwner || 'Jay')}" /></label>
          <label>Visibility<select name="visibility">${optionTags(VISIBILITIES, item.visibility)}</select></label>
        </div>
      </details>

      <input type="hidden" name="id" value="${escapeHtml(item.id)}" />
      <div class="actions full"><button class="button" type="submit">Save Item 💾</button><button class="ghost" type="button" data-route="items">Cancel</button></div>
    </form>
    ${dupes.length ? `<section class="card" style="margin-top:1rem"><h2>👯 Current Dupe Warnings</h2>${dupeList(dupes)}</section>` : ''}`;
}

function renderLooks() {
  return `
    <section class="split"><div><h2>✨ The Look Book</h2><p class="muted">Turn inspo into reusable nail recipes with linked items, requirement types, and easy little colorway checks.</p></div><button class="button" data-route="add-look">✨ Create Look</button></section>
    ${helpPanel('Requirement types', reqHelpHtml(), showHelp())}
    <section class="grid auto">${state.data.looks.length ? state.data.looks.map(look => lookCard(look, evaluateLook(state.data, look.id))).join('') : '<div class="card empty-state">No looks yet. Time to bottle some chaos.</div>'}</section>`;
}

function renderLookDetail() {
  const look = state.data.looks.find(l => l.id === state.params.id);
  if (!look) return `<div class="card empty-state">Look not found.</div>`;
  const status = evaluateLook(state.data, look.id);
  const variations = possibleVariations(state.data, look.id);
  return `
    <section class="split"><div><h2>${escapeHtml(look.title)}</h2><p class="muted">${escapeHtml(look.description)}</p></div><div class="actions"><button class="ghost" data-route="tutorial-builder" data-id="${look.id}">Edit Steps</button><button class="ghost" data-route="edit-look" data-id="${look.id}">Edit Look</button></div></section>
    ${helpPanel('How to choose requirement types', reqHelpHtml(), showHelp())}
    <section class="grid two">
      <article class="card"><div class="thumb">${look.inspoImage ? `<img src="${look.inspoImage}" alt="Inspo">` : 'Inspo Image'}</div><hr><div class="badges"><span class="badge accent">${escapeHtml(look.difficulty)}</span><span class="badge ${status.ready ? 'good' : 'warn'}">${status.label}</span></div></article>
      <article class="card"><h2>🪄 Can I Make This?</h2>${statusSummary(status)}<hr><h3>🎨 Possible Colorways</h3>${variations.length ? variations.map(v => `<p><strong>${escapeHtml(v.colorFamily)}</strong>: ${escapeHtml(itemLabel(v.item))}</p>`).join('') : '<p class="muted">No substitutions found yet.</p>'}</article>
    </section>
    <section style="margin-top:1rem" class="grid">${status.steps.map(stepResultCard).join('')}</section>`;
}

function statusSummary(status) {
  if (status.ready) return `<p><span class="badge good">Ready to make</span></p><p>All required steps are covered. Optional missing items will not block the look.</p>`;
  return `<p><span class="badge warn">${status.label}</span></p><p>Missing required items:</p><ul>${status.missing.map(result => `<li>${escapeHtml(result.step.techniqueRole)} — ${escapeHtml(result.message)}</li>`).join('')}</ul>`;
}

function stepResultCard(result) {
  const step = result.step;
  return `<article class="card step-card">
    <div class="split"><h3>Step ${step.stepNumber}: ${escapeHtml(step.techniqueRole)}</h3><span class="badge ${result.status === 'missing' ? 'danger' : result.status.startsWith('optional') ? 'warn' : 'good'}">${escapeHtml(result.message)}</span></div>
    <p>${escapeHtml(step.instruction)}</p>
    <p><strong>Requirement:</strong> ${escapeHtml(step.requirementType)}</p>
    <p><strong>Linked:</strong> ${result.linked.length ? result.linked.map(itemLabel).map(escapeHtml).join(', ') : 'None'}</p>
    <p><strong>Substitutions:</strong> ${result.substitutions.length ? result.substitutions.map(itemLabel).slice(0,6).map(escapeHtml).join(', ') : 'None found'}</p>
    ${step.notes ? `<p class="muted">${escapeHtml(step.notes)}</p>` : ''}
  </article>`;
}

function renderLookForm(id) {
  const isEdit = Boolean(id);
  const look = isEdit ? state.data.looks.find(l => l.id === id) : emptyLook();
  if (!look) return `<div class="card empty-state">Look not found.</div>`;
  return `
    <section><h2>${isEdit ? 'Edit Look' : '✨ Create Look'}</h2><p class="muted">A look is a tutorial, recipe, or design idea built from stash items.</p></section>
    <form class="card form-grid" id="lookForm">
      <label>Title<input name="title" required value="${escapeHtml(look.title)}" /></label>
      <label>Difficulty<select name="difficulty">${optionTags(DIFFICULTIES, look.difficulty)}</select></label>
      <label>Created By<input name="createdBy" value="${escapeHtml(look.createdBy || state.data.settings.activeOwner || 'Jay')}" /></label>
      <label>Visibility<select name="visibility">${optionTags(VISIBILITIES, look.visibility)}</select></label>
      <label class="full">Description<textarea name="description">${escapeHtml(look.description)}</textarea></label>
      <label class="full">Tags<input name="tags" value="${escapeHtml(tagsToString(look.tags))}" /></label>
      <label>Inspo Image<input name="inspoImageFile" type="file" accept="image/*" /></label>
      <label>Final Image<input name="finalImageFile" type="file" accept="image/*" /></label>
      <input type="hidden" name="id" value="${escapeHtml(look.id)}" />
      <div class="actions full"><button class="button" type="submit">Save Look 💾</button><button class="ghost" type="button" data-route="looks">Cancel</button></div>
    </form>`;
}

function renderTutorialBuilder() {
  const look = state.data.looks.find(l => l.id === state.params.id);
  if (!look) return `<div class="card empty-state">Look not found.</div>`;
  const steps = stepsForLook(state.data, look.id);
  return `
    <section class="split"><div><h2>🧪 Tutorial Builder</h2><p class="muted">${escapeHtml(look.title)}</p></div><button class="button" data-action="add-step" data-id="${look.id}">＋ Add Step</button></section>
    ${helpPanel('Requirement types', reqHelpHtml(), showHelp())}
    <section class="grid">${steps.length ? steps.map(stepEditor).join('') : '<div class="card empty-state">No steps yet. Add the first one.</div>'}</section>`;
}

function stepEditor(step) {
  const itemOptions = state.data.items.map(item => `<option value="${item.id}" ${(step.linkedItemIds || []).includes(item.id) ? 'selected' : ''}>${escapeHtml(itemLabel(item))}</option>`).join('');
  return `<form class="card form-grid step-form" data-step-id="${step.id}">
    <h3 class="full">Step ${step.stepNumber}</h3>
    <label>Step Number<input name="stepNumber" type="number" value="${step.stepNumber}" min="1" /></label>
    <label>Technique Role<select name="techniqueRole">${optionTags(TECHNIQUE_ROLES, step.techniqueRole)}</select></label>
    <label class="full">Instruction<textarea name="instruction">${escapeHtml(step.instruction)}</textarea></label>
    <label>Requirement Type<select name="requirementType">${optionTags(REQUIREMENT_TYPES.map(r => r.value), step.requirementType)}</select></label>
    <label>Linked Items<select name="linkedItemIds" multiple size="5">${itemOptions}</select></label>
    <label>Rule Item Type<select name="ruleProductType"><option>Any</option>${optionTags(ITEM_TYPES, step.replacementRule?.productType)}</select></label>
    <label>Rule Color Family<select name="ruleColorFamily"><option>Any</option>${optionTags(COLOR_FAMILIES, step.replacementRule?.colorFamily)}</select></label>
    <label>Rule Finish<select name="ruleFinish"><option>Any</option>${optionTags(FINISHES, step.replacementRule?.finish)}</select></label>
    <label>Rule Opacity<input name="ruleOpacity" value="${escapeHtml(step.replacementRule?.opacity || 'Any')}" /></label>
    <label class="full">Rule Tags<input name="ruleTags" value="${escapeHtml(tagsToString(step.replacementRule?.tags || []))}" /></label>
    <label class="full">Step Notes<textarea name="notes">${escapeHtml(step.notes)}</textarea></label>
    <div class="actions full"><button class="button" type="submit">Save Step 💾</button><button class="danger" type="button" data-action="delete-step" data-id="${step.id}">Delete Step</button></div>
  </form>`;
}

function renderDupes() {
  const groups = allDupeGroups(state.data.items);
  return `<section><h2>👯 Dupe Goblin</h2><p class="muted">Find exact duplicates and suspiciously similar stash twins before you buy the same sparkle twice.</p></section>
    ${groups.length ? `<section class="grid">${groups.map(group => `<article class="card"><h3>${escapeHtml(itemLabel(group.candidate))}</h3>${dupeList(group.warnings)}</article>`).join('')}</section>` : '<div class="card empty-state">No dupe warnings yet.</div>'}`;
}

function renderSettings() {
  return `<section><h2>🫧 Settings & Backup</h2><p class="muted">Local-first. Export backups early and often, beautiful little data goblin.</p></section>
    <section class="card form-grid">
      <label>Active Owner<input id="activeOwner" value="${escapeHtml(state.data.settings.activeOwner || 'Jay')}" /></label>
      <label><input id="toggleHelp" type="checkbox" ${showHelp() ? 'checked' : ''} /> Show help panels on screens</label>
      <div class="actions full"><button class="button" id="saveSettings">Save Settings</button><button class="ghost" id="exportBackup">Export Backup</button><label class="ghost">Import Backup<input id="importBackup" type="file" accept="application/json" hidden /></label><button class="danger" id="resetDemo">Reset Demo Data</button></div>
    </section>
    <section class="card" style="margin-top:1rem"><h2>What’s in v0.1.4</h2><p>Items model, inventory, low stock, restock, dupe checker, looks, tutorial steps, requirement help, substitution rules, can-I-make-this logic, JSON backup/import, GitHub Pages preview mode, plus the v0.1.1 save/photo compression patch.</p></section>`;
}

async function saveItemForm(form) {
  const fd = new FormData(form);
  const existing = fd.get('id') ? findItem(state.data, fd.get('id')) : null;
  const item = existing || emptyItem();
  const stamp = today();
  Object.assign(item, {
    id: existing?.id || uid('itm'),
    productType: fd.get('productType') || 'Polish',
    brand: String(fd.get('brand') || '').trim(),
    collection: String(fd.get('collection') || '').trim(),
    itemName: String(fd.get('itemName') || '').trim(),
    colorCode: String(fd.get('colorCode') || '').trim(),
    barcode: String(fd.get('barcode') || '').trim(),
    colorFamily: fd.get('colorFamily') || 'Other',
    finish: fd.get('finish') || 'Other',
    opacity: fd.get('opacity') || 'Unknown',
    specialEffect: String(fd.get('specialEffect') || '').trim(),
    hexEstimate: fd.get('hexEstimate') || item.hexEstimate || '#d99aaa',
    amountLeft: fd.get('amountLeft') || 'Unknown',
    ownedStatus: fd.get('ownedStatus') || 'Owned',
    restock: fd.get('restock') === 'on',
    owner: String(fd.get('owner') || state.data.settings.activeOwner || 'Jay').trim(),
    visibility: fd.get('visibility') || 'Private',
    notes: String(fd.get('notes') || '').trim(),
    tags: stringToTags(fd.get('tags') || ''),
    createdAt: existing?.createdAt || stamp,
    updatedAt: stamp
  });
  const bottle = form.elements.bottlePhotoFile.files[0];
  const swatch = form.elements.swatchPhotoFile.files[0];
  if (bottle) item.bottlePhoto = await readImageAsDataUrl(bottle);
  if (swatch) item.swatchPhoto = await readImageAsDataUrl(swatch);
  if (!existing) state.data.items.unshift(item);

  try {
    persist();
  } catch (error) {
    // Photo-heavy localStorage can fill up fast on phones. Save the item without photos instead of losing the whole entry.
    item.bottlePhoto = existing?.bottlePhoto || '';
    item.swatchPhoto = existing?.swatchPhoto || '';
    try {
      persist();
      showToast('Saved without new photos — browser storage was full.');
    } catch (secondError) {
      console.error('Save failed even after removing new photos:', secondError);
      alert(`${secondError.message || secondError} Try exporting a backup, clearing old photos, or testing without images first.`);
      return;
    }
  }

  showToast('Saved! Item added to the stash.');
  navigate('item-detail', { id: item.id });
}

async function saveLookForm(form) {
  const fd = new FormData(form);
  const existing = fd.get('id') ? state.data.looks.find(l => l.id === fd.get('id')) : null;
  const look = existing || emptyLook();
  const stamp = today();
  Object.assign(look, { id: existing?.id || uid('look'), title: fd.get('title').trim(), difficulty: fd.get('difficulty'), createdBy: fd.get('createdBy').trim(), visibility: fd.get('visibility'), description: fd.get('description').trim(), tags: stringToTags(fd.get('tags')), createdAt: existing?.createdAt || stamp, updatedAt: stamp });
  const inspo = form.elements.inspoImageFile.files[0];
  const final = form.elements.finalImageFile.files[0];
  if (inspo) look.inspoImage = await readImageAsDataUrl(inspo);
  if (final) look.finalImage = await readImageAsDataUrl(final);
  if (!existing) state.data.looks.unshift(look);
  persist();
  showToast('Saved! Look added to the Look Book.');
  navigate('tutorial-builder', { id: look.id });
}

function saveStepForm(form) {
  const step = state.data.lookSteps.find(s => s.id === form.dataset.stepId);
  if (!step) return;
  const fd = new FormData(form);
  step.stepNumber = Number(fd.get('stepNumber')) || step.stepNumber;
  step.techniqueRole = fd.get('techniqueRole');
  step.instruction = fd.get('instruction').trim();
  step.requirementType = fd.get('requirementType');
  step.linkedItemIds = Array.from(form.elements.linkedItemIds.selectedOptions).map(option => option.value);
  step.replacementRule = { productType: fd.get('ruleProductType'), colorFamily: fd.get('ruleColorFamily'), finish: fd.get('ruleFinish'), opacity: fd.get('ruleOpacity').trim() || 'Any', tags: stringToTags(fd.get('ruleTags')) };
  step.notes = fd.get('notes').trim();
  persist();
  showToast('Saved! Step updated.');
  render();
}

function showGlobalHelp() {
  helpContent.innerHTML = `<h3>🫶 Requirement Types</h3>${reqHelpHtml()}<hr><h3>🗂️ App Shape</h3><p><strong>Items</strong> are everything in the stash. <strong>Looks</strong> are tutorials or recipes. <strong>Steps</strong> link looks to items and tell the checker what is required, flexible, or optional.</p>`;
  helpDialog.showModal();
}

app.addEventListener('submit', async event => {
  event.preventDefault();
  try {
    if (event.target.id === 'itemForm') await saveItemForm(event.target);
    if (event.target.id === 'lookForm') await saveLookForm(event.target);
    if (event.target.classList.contains('step-form')) saveStepForm(event.target);
  } catch (error) {
    console.error('Save failed:', error);
    alert(`Save failed: ${error.message || error}`);
  }
});

app.addEventListener('input', event => {
  if (event.target.id === 'itemSearch') {
    state.filters.itemSearch = event.target.value;
  }
});

app.addEventListener('change', event => {
  if (event.target.id === 'itemTypeFilter') { state.filters.itemType = event.target.value; render(); }
  if (event.target.id === 'familyFilter') { state.filters.colorFamily = event.target.value; render(); }
  if (event.target.id === 'finishFilter') { state.filters.finish = event.target.value; render(); }
  if (event.target.id === 'statusFilter') { state.filters.status = event.target.value; render(); }
  if (event.target.id === 'lowOnlyFilter') { state.filters.lowOnly = event.target.checked; render(); }
});

app.addEventListener('click', async event => {
  const routeEl = event.target.closest('[data-route]');
  const actionEl = event.target.closest('[data-action]');
  if (routeEl) {
    const quick = routeEl.dataset.quickFilter;
    if (quick === 'Low') {
      state.filters.itemSearch = '';
      state.filters.itemType = 'All';
      state.filters.colorFamily = 'All';
      state.filters.finish = 'All';
      state.filters.status = 'All';
      state.filters.lowOnly = true;
      navigate('items');
      return;
    }
    if (quick === 'Wishlist') {
      state.filters.itemSearch = '';
      state.filters.itemType = 'All';
      state.filters.colorFamily = 'All';
      state.filters.finish = 'All';
      state.filters.status = 'Wishlist';
      state.filters.lowOnly = false;
      navigate('items');
      return;
    }
    navigate(routeEl.dataset.route, routeEl.dataset.id ? { id: routeEl.dataset.id } : {});
  }
  if (event.target.id === 'inlineHelpButton') showGlobalHelp();
  if (event.target.id === 'applyItemSearch') render();
  if (event.target.id === 'clearItemSearch') {
    state.filters.itemSearch = '';
    state.filters.itemType = 'All';
    state.filters.colorFamily = 'All';
    state.filters.finish = 'All';
    state.filters.status = 'All';
    state.filters.lowOnly = false;
    render();
  }
  if (actionEl?.dataset.action === 'view-item') navigate('item-detail', { id: actionEl.dataset.id });
  if (actionEl?.dataset.action === 'delete-item' && confirm('Delete this item?')) { state.data.items = state.data.items.filter(item => item.id !== actionEl.dataset.id); persist(); navigate('items'); }
  if (actionEl?.dataset.action === 'add-step') { const steps = stepsForLook(state.data, actionEl.dataset.id); const step = emptyStep(actionEl.dataset.id, steps.length + 1); step.id = uid('stp'); state.data.lookSteps.push(step); persist(); render(); }
  if (actionEl?.dataset.action === 'delete-step' && confirm('Delete this step?')) { state.data.lookSteps = state.data.lookSteps.filter(step => step.id !== actionEl.dataset.id); persist(); render(); }
  if (event.target.id === 'saveSettings') { state.data.settings.activeOwner = document.querySelector('#activeOwner').value.trim() || 'Jay'; state.data.settings.showHelpPanels = document.querySelector('#toggleHelp').checked; persist(); showToast('Settings saved.'); render(); }
  if (event.target.id === 'exportBackup') exportData(state.data);
  if (event.target.id === 'resetDemo' && confirm('Reset all local data to demo data?')) { state.data = resetData(); render(); }
});

document.body.addEventListener('change', async event => {
  if (event.target.id === 'importBackup' && event.target.files[0]) {
    try { state.data = await importDataFromFile(event.target.files[0]); render(); alert('Backup imported.'); }
    catch (error) { alert('Could not import backup. Check that it is a SwatchForge JSON file.'); }
  }
});

document.querySelectorAll('.tab').forEach(tab => tab.addEventListener('click', () => {
  if (tab.dataset.route === 'items') {
    state.filters.itemSearch = '';
    state.filters.itemType = 'All';
    state.filters.colorFamily = 'All';
    state.filters.finish = 'All';
    state.filters.status = 'All';
    state.filters.lowOnly = false;
  }
  navigate(tab.dataset.route);
}));
document.querySelector('#helpButton').addEventListener('click', showGlobalHelp);
document.querySelector('#closeHelp').addEventListener('click', () => helpDialog.close());
document.querySelector('#backButton').addEventListener('click', () => history.length > 1 ? history.back() : navigate('home'));
window.addEventListener('popstate', event => { state.route = event.state?.route || 'home'; state.params = event.state?.params || {}; render(); });

// GitHub Pages preview build: unregister old SwatchForge service workers so testers always see fresh changes.
if ('serviceWorker' in navigator && typeof navigator.serviceWorker.getRegistrations === 'function') {
  navigator.serviceWorker.getRegistrations()
    .then(registrations => registrations.forEach(registration => registration.unregister()))
    .catch(console.warn);
}
render();
