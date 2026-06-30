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

export function readImageAsDataUrl(file, options = {}) {
  const { maxSize = 900, quality = 0.72 } = options;
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(reader.result);
      img.onload = () => {
        try {
          const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
          const width = Math.max(1, Math.round(img.width * scale));
          const height = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const mime = file.type === 'image/png' && scale === 1 ? 'image/png' : 'image/jpeg';
          resolve(canvas.toDataURL(mime, quality));
        } catch (error) {
          console.warn('Image compression failed; saving original image.', error);
          resolve(reader.result);
        }
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export function helpPanel(title, bodyHtml, show = true) {
  if (!show) return '';
  return `<details class="help-box" open><summary>${escapeHtml(title)}</summary>${bodyHtml}</details>`;
}
