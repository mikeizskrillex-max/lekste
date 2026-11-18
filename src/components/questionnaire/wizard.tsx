'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { LanguageSwitcher } from '@/components/layout/language-switcher';
import { Button } from '@/components/ui/button';
import type { PickerItem } from '@/lib/ingredients/picker';
import { answers, type Draft } from '@/lib/questionnaire/schema';
import { STEPS, firstIncomplete, stepComplete, withDefaults } from '@/lib/questionnaire/steps';
import { clearDraft, loadDraft, saveDraft } from '@/lib/questionnaire/storage';
import { ProgressBar } from './progress-bar';
import { NormResult } from './result/norm-result';
import { StepView } from './step-view';

/** The 9-screen questionnaire. Answers live in localStorage; the last screen shows the norm. */
export function Wizard({ items }: { items: readonly PickerItem[] }) {
  const t = useTranslations('questionnaire');
  const headingId = useId();
  const reduce = useReducedMotion();
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [ready, setReady] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    const d = loadDraft();
    setDraft(d);
    setStep(firstIncomplete(d));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveDraft(draft);
  }, [draft, ready]);

  // move focus to the new heading so screen readers announce the question
  useEffect(() => {
    if (!ready) return;
    if (first.current) {
      first.current = false;
      return;
    }
    document.getElementById(headingId)?.focus();
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  }, [step, ready, headingId, reduce]);

  const update = useCallback((patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch })), []);
  const go = (to: number) => {
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  const id = STEPS[step];
  const complete = id ? stepComplete(id, draft) : true;
  const final = answers.safeParse(withDefaults(draft));
  const showResult = step >= STEPS.length && final.success;
  const finalOk = final.success;

  // a broken or outdated draft past the last screen: go back to the first unanswered question
  useEffect(() => {
    if (ready && step >= STEPS.length && !finalOk) setStep(firstIncomplete(draft));
  }, [ready, step, finalOk, draft]);

  if (!ready) return <div className="min-h-[60vh]" aria-busy="true" />;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-6 pb-32 md:px-6 md:pt-10">
      {!showResult && (
        <div className="mb-8 flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => go(step - 1)} disabled={step === 0} className="-ml-3">
            <ArrowLeft className="size-4" aria-hidden />
            {t('back')}
          </Button>
          <div className="flex-1">
            <ProgressBar current={Math.min(step + 1, STEPS.length)} total={STEPS.length} />
          </div>
          {/* phones: the site's bottom bar is hidden here, so the language switch lives in this row */}
          <LanguageSwitcher className="md:hidden" />
        </div>
      )}

      <AnimatePresence mode="wait" initial={false} custom={dir}>
        <motion.div
          key={showResult ? 'result' : step}
          custom={dir}
          initial={reduce ? false : { opacity: 0, x: 16 * dir }}
          animate={{ opacity: 1, x: 0 }}
          exit={reduce ? { opacity: 1 } : { opacity: 0, x: -16 * dir }}
          transition={{ duration: reduce ? 0 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
        >
          {showResult && final.success ? (
            <NormResult answers={final.data} headingId={headingId} onEdit={() => go(0)} />
          ) : (
            id && <StepView id={id} draft={draft} update={update} headingId={headingId} items={items} />
          )}
        </motion.div>
      </AnimatePresence>

      {!showResult && (
        <div className="border-line/70 bg-bg/92 fixed inset-x-0 bottom-0 z-40 border-t px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-1.5">
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-64"
              disabled={!complete}
              onClick={() => go(step + 1)}
            >
              {step === STEPS.length - 1 ? t('finish') : t('next')}
              <ArrowRight className="size-4" aria-hidden />
            </Button>
            <p className="text-muted text-center text-xs">{t('savedLocally')}</p>
          </div>
        </div>
      )}

      <div className="mt-12 flex flex-col items-center gap-2 text-center">
        <p className="text-muted text-xs">{t('disclaimer')}</p>
        {Object.keys(draft).length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              clearDraft();
              setDraft({});
              go(0);
            }}
          >
            {t('restart')}
          </Button>
        )}
      </div>
    </div>
  );
}
