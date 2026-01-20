import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface NextStep {
  next_step_slug: string;
  next_step_title: string;
  next_step_url: string;
  available: boolean;
  available_from: string | null;
}

export function useMyNextStep() {
  const { user } = useAuth();

  return useQuery<NextStep | null, Error>({
    queryKey: ['my-next-step', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('patient_next_steps')
        .select('next_step_slug, next_step_title, next_step_url, available, available_from')
        .eq('patient_id', user.id)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return null;
      }

      // Check if available_from is in the future - if so, treat as not available
      let isAvailable = data.available;
      if (isAvailable && data.available_from) {
        const availableFromDate = new Date(data.available_from);
        const now = new Date();
        if (availableFromDate > now) {
          isAvailable = false;
        }
      }

      return {
        next_step_slug: data.next_step_slug,
        next_step_title: data.next_step_title,
        next_step_url: data.next_step_url,
        available: isAvailable,
        available_from: data.available_from,
      };
    },
    enabled: !!user?.id,
  });
}
