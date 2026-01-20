import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { Database } from '@/integrations/supabase/types';

type FormResponse = Database['public']['Tables']['form_responses']['Row'];

export function useMyFormResponse(templateId: string) {
  const { user } = useAuth();

  return useQuery<FormResponse | null, Error>({
    queryKey: ['form-response', templateId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('template_id', templateId)
        .eq('patient_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!user?.id && !!templateId,
  });
}

interface UpsertFormResponseParams {
  templateId: string;
  answersJson: Record<string, unknown>;
}

export function useUpsertMyFormResponse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ templateId, answersJson }: UpsertFormResponseParams) => {
      if (!user?.id) {
        throw new Error('Usuario no autenticado');
      }

      const payload = {
        template_id: templateId,
        patient_id: user.id,
        answers_json: answersJson as unknown as Database['public']['Tables']['form_responses']['Insert']['answers_json'],
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('form_responses')
        .upsert(payload, {
          onConflict: 'patient_id,template_id',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['form-response', variables.templateId, user?.id],
      });
    },
  });
}
