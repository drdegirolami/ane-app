import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type FormTemplate = Database['public']['Tables']['form_templates']['Row'];

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
