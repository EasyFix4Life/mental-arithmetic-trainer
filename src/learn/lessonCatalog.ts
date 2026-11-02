import source from '../../requirements/instruction/Mental_Arithmetic_Instructional_Lessons_Codex_2026-10-24.json';
import { isAvailableSettings } from '../availableOptions';
import { confirmedMultiplicationExamples } from './confirmedMultiplicationExamples';
import type { Lesson } from './lessonTypes';

/** Preserve the source registry and relative lesson order, then apply the
 * owner's current app offerings without changing the supplied documents. */
const catalog: readonly Lesson[] = [
  ...[...source.lessons].sort((a, b) => a.order - b.order).map((record): Lesson => {
    const examples = record.id === 'multiplication-2' ? confirmedMultiplicationExamples : undefined;
    return {
      id: record.id,
      title: record.title,
      operation: record.operation as Lesson['operation'],
      digitCount: record.digits_per_operand as Lesson['digitCount'],
      authoredStatus: examples ? 'Owner-confirmed examples and owner-described method' : 'Owner-described positional method',
      example: examples?.[0]?.example ?? null,
      steps: examples?.[0]?.steps ?? [],
      ...(examples ? { examples } : {}),
    };
  }),
  { id: 'addition-3', title: 'Three-digit addition', operation: 'addition', digitCount: 3,
    authoredStatus: 'Owner-described positional method', example: null, steps: [] },
  { id: 'multiplication-3', title: 'Three-digit multiplication', operation: 'multiplication', digitCount: 3,
    authoredStatus: 'Owner-described five-group method', example: null, steps: [] },
];

export const lessons: readonly Lesson[] = catalog.filter(isAvailableSettings);

export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id);
}
