function clean(value) { return String(value || '').trim().toLowerCase(); }
function tagOverlap(a = [], b = []) {
  const set = new Set((a || []).map(clean));
  return (b || []).map(clean).filter(tag => set.has(tag));
}

export function dupeWarningsForItem(candidate, items) {
  const warnings = [];
  items.filter(item => item.id !== candidate.id).forEach(item => {
    let score = 0;
    const reasons = [];
    if (candidate.barcode && clean(candidate.barcode) === clean(item.barcode)) { score += 100; reasons.push('Same barcode'); }
    if (candidate.brand && candidate.colorCode && clean(candidate.brand) === clean(item.brand) && clean(candidate.colorCode) === clean(item.colorCode)) { score += 90; reasons.push('Same brand + color code'); }
    if (candidate.brand && candidate.itemName && clean(candidate.brand) === clean(item.brand) && clean(candidate.itemName) === clean(item.itemName)) { score += 80; reasons.push('Same brand + item name'); }
    if (candidate.productType === item.productType) { score += 10; reasons.push('Same item type'); }
    if (candidate.colorFamily === item.colorFamily) { score += 16; reasons.push('Same color family'); }
    if (candidate.finish === item.finish) { score += 16; reasons.push('Same finish'); }
    if (candidate.opacity && candidate.opacity === item.opacity) { score += 8; reasons.push('Same opacity'); }
    const overlap = tagOverlap(candidate.tags, item.tags);
    if (overlap.length) { score += Math.min(18, overlap.length * 6); reasons.push(`Shared tags: ${overlap.join(', ')}`); }
    if (score >= 36) warnings.push({ item, score, reasons });
  });
  return warnings.sort((a, b) => b.score - a.score);
}

export function allDupeGroups(items) {
  return items.map(item => ({ candidate: item, warnings: dupeWarningsForItem(item, items).slice(0, 4) }))
    .filter(group => group.warnings.length);
}
