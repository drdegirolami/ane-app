import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Records that the current patient accessed a form by slug.
 * Uses INSERT ... ON CONFLICT to only record the first access.
 */
export function useRecordFormAccess(slug: string | undefined) {
  const { user, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!slug || !user?.id || isAdmin) return;

    const record = async () => {
      const { error } = await supabase
        .from('patient_form_access' as any)
        .upsert(
          { patient_id: user.id, form_slug: slug } as any,
          { onConflict: 'patient_id,form_slug', ignoreDuplicates: true }
        );

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ['patient-form-access', user.id] });
      }
    };

    record();
  }, [slug, user?.id, isAdmin, queryClient]);
}

/**
 * Returns all form slugs the current patient has accessed.
 */
export function useMyAccessedFormSlugs() {
  const { user } = useAuth();

  return useQuery<string[], Error>({
    queryKey: ['patient-form-access', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('patient_form_access' as any)
        .select('form_slug')
        .eq('patient_id', user.id);

      if (error) throw error;
      return (data as any[])?.map((r) => r.form_slug) || [];
    },
    enabled: !!user?.id,
  });
}
