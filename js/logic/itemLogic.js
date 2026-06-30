export function ownedItems(data) {
  return data.items.filter(item => item.ownedStatus === 'Owned' || item.ownedStatus === 'Borrowed');
}

export function lowStockItems(data) {
  return data.items.filter(item => ['Low', 'Empty'].includes(item.amountLeft) || item.restock);
}

export function wishlistItems(data) {
  return data.items.filter(item => item.ownedStatus === 'Wishlist');
}

export function filterItems(items, filters) {
  const q = (filters.itemSearch || '').toLowerCase();
  return items.filter(item => {
    const haystack = [item.brand, item.collection, item.itemName, item.colorCode, item.barcode, item.colorFamily, item.finish, item.productType, item.owner, ...(item.tags || [])].join(' ').toLowerCase();
    const matchesSearch = !q || haystack.includes(q);
    const matchesType = filters.itemType === 'All' || item.productType === filters.itemType;
    const matchesFamily = filters.colorFamily === 'All' || item.colorFamily === filters.colorFamily;
    const matchesFinish = filters.finish === 'All' || item.finish === filters.finish;
    return matchesSearch && matchesType && matchesFamily && matchesFinish;
  });
}

export function findItem(data, id) {
  return data.items.find(item => item.id === id);
}

export function itemLabel(item) {
  if (!item) return 'Missing item';
  const brand = item.brand ? `${item.brand} — ` : '';
  return `${brand}${item.itemName || 'Unnamed item'}`;
}
