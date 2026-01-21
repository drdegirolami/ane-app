import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FormTemplate } from './useFormTemplates';

export interface EnabledForm extends FormTemplate {
  displayTitle: string;
  url: string;
}

export function useMyEnabledForms() {
  const { user } = useAuth();

  return useQuery<EnabledForm[], Error>({
    queryKey: ['my-enabled-forms', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Get all next_steps for the patient
      const { data: nextSteps, error: stepsError } = await supabase
        .from('patient_next_steps')
        .select('next_step_slug, next_step_title, next_step_url, available, available_from')
        .eq('patient_id', user.id);

      if (stepsError) {
        throw stepsError;
      }

      // 2. Filter: 'form:' prefix, available=true, available_from <= now or null
      const now = new Date();
      const formSteps = nextSteps?.filter(step => {
        if (!step.next_step_slug.startsWith('form:')) return false;
        if (!step.available) return false;
        if (step.available_from && new Date(step.available_from) > now) return false;
        return true;
      }) || [];

      if (formSteps.length === 0) return [];

      // 3. Extract form slugs (remove 'form:' prefix)
      const formSlugs = formSteps.map(step => 
        step.next_step_slug.replace('form:', '')
      );

      // 4. Get corresponding templates
      const { data: templates, error: templatesError } = await supabase
        .from('form_templates')
        .select('*')
        .in('slug', formSlugs)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (templatesError) {
        throw templatesError;
      }

      // 5. Combine template with presentation info from patient_next_steps
      return (templates || []).map(template => {
        const step = formSteps.find(s => 
          s.next_step_slug === `form:${template.slug}`
        );
        
        return {
          ...template,
          displayTitle: step?.next_step_title || template.title,
          url: step?.next_step_url || `/form/${template.slug}`,
        };
      });
    },
    enabled: !!user?.id,
  });
}
