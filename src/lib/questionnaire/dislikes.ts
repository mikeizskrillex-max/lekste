/** Quick chips on the "Ko nevalgote?" screen. Each chip selects a group of catalogue ingredients. */
export const DISLIKE_GROUPS = {
  fish: ['salmon', 'cod', 'herring', 'pickled_herring', 'mackerel', 'tuna_canned', 'tilapia'],
  seafood: ['shrimp'],
  mushrooms: ['mushroom', 'chanterelles'],
  cottage: ['cottage_cheese_low', 'cottage_cheese', 'farmer_cheese', 'curd_snack'],
  beetroot: ['beetroot', 'cooked_beetroot'],
  liver: ['chicken_liver'],
  pork: ['pork_mince', 'pork_shoulder', 'pork_loin', 'pork_ribs', 'bacon', 'ham', 'lasiniai', 'frankfurters'],
  onion: ['onion', 'red_onion', 'spring_onion', 'leek'],
  sauerkraut: ['sauerkraut'],
  spicy: ['horseradish', 'mustard', 'ginger', 'curry'],
} as const satisfies Record<string, readonly string[]>;
export type DislikeGroup = keyof typeof DISLIKE_GROUPS;
export const DISLIKE_GROUP_IDS = Object.keys(DISLIKE_GROUPS) as DislikeGroup[];

/** Toggle a whole group: if every item is already selected, remove them; otherwise add the missing ones. */
export function toggleGroup(selected: readonly string[], group: DislikeGroup): string[] {
  const items: readonly string[] = DISLIKE_GROUPS[group];
  const all = items.every((s) => selected.includes(s));
  return all
    ? selected.filter((s) => !items.includes(s))
    : [...selected, ...items.filter((s) => !selected.includes(s))];
}

export function groupSelected(selected: readonly string[], group: DislikeGroup): boolean {
  return (DISLIKE_GROUPS[group] as readonly string[]).every((s) => selected.includes(s));
}
