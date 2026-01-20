import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type FormTemplate = Database['public']['Tables']['form_templates']['Row'];

// Schema types for type-safe rendering
export interface FormField {
  key: string;
  label: string;
  helpText?: string;
  type: 'text' | 'textarea' | 'number';
  required: boolean;
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormSchema {
  version: number;
  sections: FormSection[];
  success: {
    title: string;
    message: string;
    primaryCtaLabel: string;
    primaryCtaTo: string;
  };
}

export function useFormTemplates() {
  return useQuery<FormTemplate[], Error>({
    queryKey: ['form-templates', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useFormTemplateBySlug(slug: string) {
  return useQuery<FormTemplate | null, Error>({
    queryKey: ['form-template', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });
}
