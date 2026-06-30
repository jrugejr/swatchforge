import { escapeHtml, imageOrPlaceholder } from './helpers.js';

export function itemCard(item) {
  const low = item.amountLeft === 'Low' || item.amountLeft === 'Empty';
  const wishlist = item.ownedStatus === 'Wishlist';
  return `
    <article class="card item-card" data-item-id="${item.id}">
      <div class="thumb">${imageOrPlaceholder(item.swatchPhoto || item.bottlePhoto, item.colorFamily || item.productType)}</div>
      <div class="split">
        <div>
          <h3>${escapeHtml(item.brand || 'Unbranded')}</h3>
          <p><strong>${escapeHtml(item.itemName || 'Unnamed item')}</strong><br><small>${escapeHtml(item.collection || 'No collection')} ${item.colorCode ? `· Code ${escapeHtml(item.colorCode)}` : ''}</small></p>
        </div>
        <span class="swatch-dot" style="background:${escapeHtml(item.hexEstimate || '#ddd')}"></span>
      </div>
      <div class="badges">
        <span class="badge accent">${escapeHtml(item.productType)}</span>
        <span class="badge">${escapeHtml(item.colorFamily)}</span>
        <span class="badge">${escapeHtml(item.finish)}</span>
        <span class="badge ${low ? 'warn' : 'good'}">${escapeHtml(item.amountLeft)}</span>
        ${wishlist ? '<span class="badge warn">Wishlist</span>' : ''}
        ${item.restock ? '<span class="badge danger">Restock</span>' : ''}
      </div>
      <div class="actions">
        <button class="ghost" data-action="view-item" data-id="${item.id}">Details</button>
        <button class="ghost" data-route="edit-item" data-id="${item.id}">Edit</button>
      </div>
    </article>`;
}

export function lookCard(look, status) {
  return `
    <article class="card look-card" data-look-id="${look.id}">
      <div class="thumb">${imageOrPlaceholder(look.inspoImage || look.finalImage, 'Look inspo')}</div>
      <div>
        <h3>${escapeHtml(look.title || 'Untitled look')}</h3>
        <p class="muted">${escapeHtml(look.description || 'No description yet.')}</p>
      </div>
      <div class="badges">
        <span class="badge accent">${escapeHtml(look.difficulty)}</span>
        <span class="badge ${status?.ready ? 'good' : 'warn'}">${status?.label || 'Not checked'}</span>
      </div>
      <div class="actions">
        <button class="ghost" data-route="look-detail" data-id="${look.id}">Open</button>
        <button class="ghost" data-route="edit-look" data-id="${look.id}">Edit</button>
      </div>
    </article>`;
}
