import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

// Re-exportar tipos desde el archivo compartido
export type { FormField, FormSection, FormSchema, FormFieldOption } from '@/types/forms';

export type FormTemplate = Database['public']['Tables']['form_templates']['Row'];

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
