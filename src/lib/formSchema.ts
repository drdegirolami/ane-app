import { FormField, FormSchema, ScoreResult } from '@/types/forms';

type LegacyOption = {
  value?: string;
  label?: string;
  score?: number;
};

type LegacyField = {
  id?: string;
  key?: string;
  label?: string;
  helpText?: string;
  type?: FormField['type'];
  required?: boolean;
  options?: LegacyOption[];
};

type LegacyResultRange = {
  min?: number;
  max?: number;
  min_score?: number;
  max_score?: number;
  label?: string;
  result_title?: string;
  description?: string;
  result_text?: string;
};

type LegacySchema = Partial<FormSchema> & {
  fields?: LegacyField[];
  scoring?: FormSchema['scoring'] | boolean;
  result_ranges?: LegacyResultRange[];
};

const FIELD_TYPES: FormField['type'][] = ['text', 'textarea', 'number', 'radio', 'checkbox'];

function normalizeField(field: LegacyField, index: number): FormField {
  const type = FIELD_TYPES.includes(field.type as FormField['type'])
    ? (field.type as FormField['type'])
    : 'text';

  return {
    key: field.key || field.id || `field_${index + 1}`,
    label: field.label || `Pregunta ${index + 1}`,
    helpText: field.helpText,
    type,
    required: field.required === true,
    options: Array.isArray(field.options)
      ? field.options.map((option, optionIndex) => ({
          value: option.value || `option_${optionIndex + 1}`,
          label: option.label || `Opción ${optionIndex + 1}`,
          score: option.score,
        }))
      : undefined,
  };
}

function normalizeScoreResults(ranges: LegacyResultRange[] | undefined): ScoreResult[] {
  if (!Array.isArray(ranges)) return [];

  return ranges.map((range) => ({
    min_score: range.min_score ?? range.min ?? 0,
    max_score: range.max_score ?? range.max ?? 0,
    result_title: range.result_title ?? range.label ?? 'Resultado',
    result_text: range.result_text ?? range.description ?? '',
  }));
}

export function normalizeFormSchema(input: FormSchema | LegacySchema | null | undefined): FormSchema {
  const raw = (input ?? {}) as LegacySchema;
  const scoringResults = normalizeScoreResults(raw.result_ranges);
  const normalizedScoring =
    raw.scoring && typeof raw.scoring === 'object' && 'results' in raw.scoring
      ? {
          enabled: raw.scoring.enabled === true,
          results: normalizeScoreResults(raw.scoring.results),
        }
      : raw.scoring === true || scoringResults.length > 0
        ? {
            enabled: true,
            results: scoringResults,
          }
        : undefined;

  if (Array.isArray(raw.sections)) {
    return {
      version: typeof raw.version === 'number' ? raw.version : 1,
      sections: raw.sections.map((section) => ({
        title: section.title || 'Sección',
        description: section.description,
        fields: Array.isArray(section.fields)
          ? section.fields.map((field, index) => normalizeField(field, index))
          : [],
      })),
      success: raw.success,
      scoring: normalizedScoring,
    };
  }

  return {
    version: typeof raw.version === 'number' ? raw.version : 1,
    sections: Array.isArray(raw.fields)
      ? [
          {
            title: 'Preguntas',
            fields: raw.fields.map((field, index) => normalizeField(field, index)),
          },
        ]
      : [],
    success: raw.success,
    scoring: normalizedScoring,
  };
}
