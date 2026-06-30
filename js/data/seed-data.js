export const seedData = {
  version: '0.1.0',
  settings: {
    appName: 'SwatchForge',
    activeOwner: 'Jay',
    owners: ['Jay', 'Friend'],
    showHelpPanels: true
  },
  items: [
    {
      id: 'itm_red_jelly', productType: 'Polish', brand: 'Cirque Colors', collection: 'Jellies', itemName: 'Lucky Jelly', colorCode: 'JLY-RED', barcode: 'demo-001', colorFamily: 'Red', finish: 'Jelly', opacity: 'Translucent', specialEffect: '', hexEstimate: '#b31324', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Mostly Full', ownedStatus: 'Owned', restock: false, owner: 'Jay', visibility: 'Shared', notes: 'Great for glass nail looks. Thin coats are the move.', tags: ['jelly','glass','red'], createdAt: '2026-06-30', updatedAt: '2026-06-30'
    },
    {
      id: 'itm_blue_jelly', productType: 'Polish', brand: 'Demo Brand', collection: 'Transparent Tints', itemName: 'Blue Window', colorCode: 'BW-22', barcode: 'demo-002', colorFamily: 'Blue', finish: 'Jelly', opacity: 'Translucent', specialEffect: '', hexEstimate: '#2678b8', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Half', ownedStatus: 'Owned', restock: false, owner: 'Friend', visibility: 'Shared', notes: 'Blue glass variation candidate.', tags: ['jelly','glass','blue'], createdAt: '2026-06-30', updatedAt: '2026-06-30'
    },
    {
      id: 'itm_top_gloss', productType: 'Top Coat', brand: 'Seche', collection: '', itemName: 'Glossy Top Coat', colorCode: '', barcode: 'demo-003', colorFamily: 'Clear', finish: 'Top Coat', opacity: 'Clear', specialEffect: 'Gloss', hexEstimate: '#ffffff', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Low', ownedStatus: 'Owned', restock: true, owner: 'Jay', visibility: 'Shared', notes: 'Running low. Restock soon.', tags: ['top coat','glossy','sealant'], createdAt: '2026-06-30', updatedAt: '2026-06-30'
    },
    {
      id: 'itm_base', productType: 'Base Coat', brand: 'ORLY', collection: '', itemName: 'Bonder Base', colorCode: '', barcode: 'demo-004', colorFamily: 'Clear', finish: 'Base Coat', opacity: 'Clear', specialEffect: '', hexEstimate: '#fff9ef', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Full', ownedStatus: 'Owned', restock: false, owner: 'Jay', visibility: 'Shared', notes: 'Default prep step.', tags: ['base coat','prep'], createdAt: '2026-06-30', updatedAt: '2026-06-30'
    },
    {
      id: 'itm_chrome', productType: 'Powder', brand: 'Demo Supply', collection: '', itemName: 'Silver Chrome Powder', colorCode: 'CP-01', barcode: 'demo-005', colorFamily: 'Silver', finish: 'Chrome', opacity: 'Opaque', specialEffect: 'Chrome', hexEstimate: '#c8c8c8', bottlePhoto: '', swatchPhoto: '', amountLeft: 'Wishlist', ownedStatus: 'Wishlist', restock: false, owner: 'Jay', visibility: 'Shared', notes: 'Needed for stronger glass/chrome looks.', tags: ['chrome','powder','silver'], createdAt: '2026-06-30', updatedAt: '2026-06-30'
    }
  ],
  looks: [
    {
      id: 'look_red_glass', title: 'Red Glass Nails', description: 'A translucent red glass look with a glossy finish and optional chrome highlight.', inspoImage: '', finalImage: '', difficulty: 'Intermediate', tags: ['glass','jelly','red','glossy'], visibility: 'Shared', createdBy: 'Jay', createdAt: '2026-06-30', updatedAt: '2026-06-30'
    }
  ],
  lookSteps: [
    { id: 'stp_001', lookId: 'look_red_glass', stepNumber: 1, instruction: 'Prime nail with a reliable base coat.', techniqueRole: 'Prep', requirementType: 'Tool Required', linkedItemIds: ['itm_base'], replacementRule: { productType: 'Base Coat', colorFamily: 'Clear', finish: 'Base Coat', opacity: 'Clear', tags: ['prep'] }, notes: 'Any base coat they trust should work.' },
    { id: 'stp_002', lookId: 'look_red_glass', stepNumber: 2, instruction: 'Apply one thin coat of translucent red jelly polish.', techniqueRole: 'Main Jelly Color', requirementType: 'Similar Allowed', linkedItemIds: ['itm_red_jelly'], replacementRule: { productType: 'Polish', colorFamily: 'Any', finish: 'Jelly', opacity: 'Translucent', tags: ['jelly','glass'] }, notes: 'This is the color role. Swap to blue/green/orange jelly for variations.' },
    { id: 'stp_003', lookId: 'look_red_glass', stepNumber: 3, instruction: 'Add a light chrome highlight if you want the glass reflection effect.', techniqueRole: 'Chrome / Powder', requirementType: 'Optional', linkedItemIds: ['itm_chrome'], replacementRule: { productType: 'Powder', colorFamily: 'Silver', finish: 'Chrome', opacity: 'Opaque', tags: ['chrome'] }, notes: 'Optional. Missing this should not block the look.' },
    { id: 'stp_004', lookId: 'look_red_glass', stepNumber: 4, instruction: 'Seal with glossy top coat.', techniqueRole: 'Sealant', requirementType: 'Tool Required', linkedItemIds: ['itm_top_gloss'], replacementRule: { productType: 'Top Coat', colorFamily: 'Clear', finish: 'Top Coat', opacity: 'Clear', tags: ['glossy','sealant'] }, notes: 'Gloss is what sells the glass effect.' }
  ]
};
