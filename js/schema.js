export function emptyItem() {
  return {
    id: '', productType: 'Polish', brand: '', collection: '', itemName: '', colorCode: '', barcode: '', colorFamily: 'Other', finish: 'Other', opacity: '', specialEffect: '', hexEstimate: '#d99aaa', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Full', ownedStatus: 'Owned', restock: false, owner: 'Jay', visibility: 'Private', notes: '', tags: [], createdAt: '', updatedAt: ''
  };
}

export function emptyLook() {
  return {
    id: '', title: '', description: '', inspoImage: '', finalImage: '', difficulty: 'Beginner', tags: [], visibility: 'Private', createdBy: 'Jay', createdAt: '', updatedAt: ''
  };
}

export function emptyStep(lookId, stepNumber) {
  return {
    id: '', lookId, stepNumber, instruction: '', techniqueRole: 'Other', requirementType: 'Similar Allowed', linkedItemIds: [], replacementRule: { productType: 'Any', colorFamily: 'Any', finish: 'Any', opacity: 'Any', tags: [] }, notes: ''
  };
}
