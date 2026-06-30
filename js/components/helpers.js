export function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

export function optionTags(options, selected = '') {
  return options.map(option => `<option value="${escapeHtml(option)}" ${option === selected ? 'selected' : ''}>${escapeHtml(option)}</option>`).join('');
}

export function tagsToString(tags = []) {
  return Array.isArray(tags) ? tags.join(', ') : String(tags || '');
}

export function stringToTags(value = '') {
  return value.split(',').map(tag => tag.trim().toLowerCase()).filter(Boolean);
}

export function imageOrPlaceholder(src, label) {
  if (src) return `<img src="${src}" alt="${escapeHtml(label)}" />`;
  return `<span>${escapeHtml(label)}</span>`;
}

export function readImageAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function helpPanel(title, bodyHtml, show = true) {
  if (!show) return '';
  return `<details class="help-box" open><summary>${escapeHtml(title)}</summary>${bodyHtml}</details>`;
}
