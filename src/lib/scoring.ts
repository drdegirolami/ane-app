// Utilidades para cálculo de puntaje en tests clínicos

import { FormSchema, ScoringConfig, ScoreResult } from '@/types/forms';

/**
 * Calcula el puntaje total sumando los scores de las opciones seleccionadas
 */
export function calculateScore(
  schema: FormSchema,
  answers: Record<string, unknown>
): number {
  let totalScore = 0;

  schema.sections.forEach(section => {
    section.fields.forEach(field => {
      if (field.type === 'radio' && field.options) {
        const selectedValue = answers[field.key] as string;
        const selectedOption = field.options.find(o => o.value === selectedValue);
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
  return scoring.results.find(
    r => score >= r.min_score && score <= r.max_score
  ) ?? null;
}

/**
 * Verifica si un schema tiene scoring habilitado
 */
export function hasScoringEnabled(schema: FormSchema): boolean {
  return schema.scoring?.enabled === true && 
         Array.isArray(schema.scoring.results) && 
         schema.scoring.results.length > 0;
}
