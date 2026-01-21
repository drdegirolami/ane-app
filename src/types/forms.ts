// Tipos compartidos para el sistema de formularios dinámicos

export interface FormFieldOption {
  value: string;
  label: string;
  score?: number; // Puntaje asociado a esta opción (para tests con scoring)
}

export interface FormField {
  key: string;
  label: string;
  helpText?: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'checkbox';
  required: boolean;
  options?: FormFieldOption[]; // Solo para radio y checkbox
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

// Resultado por rango de puntaje
export interface ScoreResult {
  min_score: number;
  max_score: number;
  result_title: string;
  result_text: string;
}

// Configuración de scoring del formulario
export interface ScoringConfig {
  enabled: boolean;
  results: ScoreResult[];
}

export interface FormSchema {
  version: number;
  sections: FormSection[];
  success?: {
    title: string;
    message: string;
    primaryCtaLabel: string;
    primaryCtaTo: string;
  };
  scoring?: ScoringConfig; // Configuración de puntajes para tests
}

// Tipos de datos guardados por campo:
// - text/textarea: string
// - number: number
// - radio: string (valor seleccionado)
// - checkbox: string[] (valores seleccionados)
