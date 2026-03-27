// Utilidades para cálculo de puntaje en tests clínicos

import { FormSchema, ScoringConfig, ScoreResult } from '@/types/forms';
import { normalizeFormSchema } from '@/lib/formSchema';

/**
 * Calcula el puntaje total sumando los scores de las opciones seleccionadas
 */
export function calculateScore(
  schema: FormSchema,
  answers: Record<string, unknown>
): number {
  const normalizedSchema = normalizeFormSchema(schema);
  let totalScore = 0;

  normalizedSchema.sections.forEach((section) => {
    section.fields.forEach((field) => {
      if (field.type === 'radio' && field.options) {
        const selectedValue = answers[field.key] as string;
        const selectedOption = field.options.find((option) => option.value === selectedValue);
        if (selectedOption?.score !== undefined) {
          totalScore += selectedOption.score;
        }
      }
    });
  });

  return totalScore;
}

/**
 * Encuentra el resultado correspondiente según el puntaje obtenido
 */
export function getScoreResult(
  scoring: ScoringConfig,
  score: number
): ScoreResult | null {
  return (
    scoring.results.find((result) => score >= result.min_score && score <= result.max_score) ?? null
  );
}

/**
 * Verifica si un schema tiene scoring habilitado
 */
export function hasScoringEnabled(schema: FormSchema): boolean {
  const normalizedSchema = normalizeFormSchema(schema);

  return (
    normalizedSchema.scoring?.enabled === true &&
    Array.isArray(normalizedSchema.scoring.results) &&
    normalizedSchema.scoring.results.length > 0
  );
}
