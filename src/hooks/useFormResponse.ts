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

type UpsertArgs = {
  templateId: string;
  answersJson: Record<string, unknown>;
};

export function useUpsertMyFormResponse() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<FormResponse, Error, UpsertArgs>({
    mutationFn: async ({ templateId, answersJson }: UpsertArgs) => {
      if (!user?.id) {
        throw new Error('Not authenticated');
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
    onSuccess: (_data, variables) => {
      // Invalidate the specific response query
      queryClient.invalidateQueries({
        queryKey: ['form-response', variables.templateId, user?.id],
      });
      // Invalidate templates list (for showing pending/completed status)
      queryClient.invalidateQueries({
        queryKey: ['form-templates', 'active'],
      });
    },
  });
}
