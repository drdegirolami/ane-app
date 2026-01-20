// Tipos compartidos para el sistema de formularios dinámicos

export interface FormFieldOption {
  value: string;
  label: string;
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

export interface FormSchema {
  version: number;
  sections: FormSection[];
  success?: {
    title: string;
    message: string;
    primaryCtaLabel: string;
    primaryCtaTo: string;
  };
}

// Tipos de datos guardados por campo:
// - text/textarea: string
// - number: number
// - radio: string (valor seleccionado)
// - checkbox: string[] (valores seleccionados)
