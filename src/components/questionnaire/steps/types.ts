import type { Draft } from '@/lib/questionnaire/schema';

export interface StepProps {
  draft: Draft;
  update: (patch: Partial<Draft>) => void;
  headingId: string;
}
