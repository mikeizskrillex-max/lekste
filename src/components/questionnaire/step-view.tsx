'use client';

import type { PickerItem } from '@/lib/ingredients/picker';
import type { StepId } from '@/lib/questionnaire/steps';
import { ActivityStep } from './steps/activity';
import { AllergiesStep } from './steps/allergies';
import { BodyStep } from './steps/body';
import { BudgetStep } from './steps/budget';
import { DietStep } from './steps/diet';
import { DislikesStep } from './steps/dislikes';
import { GoalStep } from './steps/goal';
import { HouseholdStep } from './steps/household';
import { StoreStep } from './steps/store';
import type { StepProps } from './steps/types';

export function StepView({ id, items, ...props }: StepProps & { id: StepId; items: readonly PickerItem[] }) {
  switch (id) {
    case 'goal':
      return <GoalStep {...props} />;
    case 'household':
      return <HouseholdStep {...props} />;
    case 'body':
      return <BodyStep {...props} />;
    case 'activity':
      return <ActivityStep {...props} />;
    case 'budget':
      return <BudgetStep {...props} />;
    case 'diet':
      return <DietStep {...props} />;
    case 'allergies':
      return <AllergiesStep {...props} />;
    case 'dislikes':
      return <DislikesStep {...props} items={items} />;
    case 'store':
      return <StoreStep {...props} />;
  }
}
