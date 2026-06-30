export const ITEM_TYPES = [
  'Polish', 'Base Coat', 'Top Coat', 'Treatment', 'Gel', 'Powder', 'Tool', 'Decoration', 'Sticker / Decal', 'Charm', 'Other'
];

export const COLOR_FAMILIES = [
  'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue', 'Purple', 'Brown', 'Nude', 'White', 'Black', 'Gray', 'Silver', 'Gold', 'Clear', 'Multicolor', 'Other'
];

export const FINISHES = [
  'Creme', 'Jelly', 'Sheer', 'Shimmer', 'Glitter', 'Holographic', 'Chrome', 'Metallic', 'Pearl', 'Magnetic / Cat Eye', 'Thermal', 'Matte', 'Topper', 'Flakie', 'Duochrome', 'Multichrome', 'Glow', 'Clear', 'Base Coat', 'Top Coat', 'Tool', 'Decoration', 'Other'
];

export const AMOUNTS = ['Full', 'Mostly Full', 'Half', 'Low', 'Empty', 'Backup Owned', 'Unknown'];
export const OWNED_STATUSES = ['Owned', 'Wishlist', 'Used Up', 'Decluttered', 'Borrowed'];
export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced', 'Chaos Gremlin'];
export const VISIBILITIES = ['Private', 'Shared'];

export const REQUIREMENT_TYPES = [
  {
    value: 'Exact Required',
    meaning: 'This exact item is needed. The checker blocks the look if it is missing.'
  },
  {
    value: 'Similar Allowed',
    meaning: 'A close match can work. The checker searches by item type, color family, finish, opacity, and tags.'
  },
  {
    value: 'Any Color Works',
    meaning: 'The technique matters more than the color. The checker looks for items with the right type/finish/role.'
  },
  {
    value: 'Optional',
    meaning: 'Nice to have, but not needed to make the look.'
  },
  {
    value: 'Tool Required',
    meaning: 'A required tool or supply, not a color-specific polish.'
  }
];

export const TECHNIQUE_ROLES = [
  'Prep', 'Base Layer', 'Main Color', 'Main Jelly Color', 'Accent Color', 'Linework', 'Chrome / Powder', 'Glitter / Topper', 'Magnetic Effect', 'Decoration', 'Sealant', 'Tool', 'Other'
];
