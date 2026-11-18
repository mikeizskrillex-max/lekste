import { body, type Draft } from './schema';

/** The nine screens, in order (owner decision: meals on "household", cooking time on "store"). */
export const STEPS = [
  'goal',
  'household',
  'body',
  'activity',
  'budget',
  'diet',
  'allergies',
  'dislikes',
  'store',
] as const;
export type StepId = (typeof STEPS)[number];

/** Starting budget for the slider only — 30 € per adult, 20 € per child (SPEC §2 demo households). Not a price. */
export function defaultBudget(adults: number, children: number): number {
  return Math.min(300, Math.max(10, adults * 30 + children * 20));
}

/** Can the person go on from this screen? Optional screens (allergies, dislikes) are always complete. */
export function stepComplete(step: StepId, d: Draft): boolean {
  switch (step) {
    case 'goal':
      return d.goal !== undefined;
    case 'household':
      return d.adults !== undefined && d.meals !== undefined;
    case 'body':
      return (
        d.consentAt !== undefined &&
        body.safeParse(d.me ?? {}).success &&
        d.health !== undefined &&
        !(d.health === 'pregnant' && d.me?.sex !== 'female') &&
        !(d.health === 'breastfeeding' && d.me?.sex !== 'female')
      );
    case 'activity':
      return d.activity !== undefined;
    case 'budget':
      return d.budgetEur !== undefined;
    case 'diet':
      return d.diet !== undefined;
    case 'allergies':
    case 'dislikes':
      return true;
    case 'store':
      return d.store !== undefined && d.cookTime !== undefined;
  }
}

/** First screen that still needs an answer (where a returning visitor continues). */
export function firstIncomplete(d: Draft): number {
  const i = STEPS.findIndex((s) => !stepComplete(s, d));
  return i === -1 ? STEPS.length : i;
}

/** Fill in defaults for the optional parts so the draft becomes complete answers. */
export function withDefaults(d: Draft): Draft {
  return {
    children: [],
    others: [],
    allergies: [],
    dislikes: [],
    ...d,
  };
}
