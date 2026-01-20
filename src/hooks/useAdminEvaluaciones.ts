import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type FormResponse = Database['public']['Tables']['form_responses']['Row'];

export interface PatientWithResponse {
  profile: Profile;
  response: FormResponse | null;
}

export function useAdminPatientsWithResponses(templateId: string) {
  return useQuery<PatientWithResponse[], Error>({
    queryKey: ['admin-patients-responses', templateId],
    queryFn: async () => {
      // Fetch all patient profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name', { ascending: true });

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Fetch all responses for this template
      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('template_id', templateId);

      if (responsesError) {
        throw responsesError;
      }

      // Map responses by patient_id for quick lookup
      const responseMap = new Map<string, FormResponse>();
      responses?.forEach((r) => {
        responseMap.set(r.patient_id, r);
      });

      // Combine profiles with their responses
      return profiles.map((profile) => ({
        profile,
        response: responseMap.get(profile.user_id) || null,
      }));
    },
    enabled: !!templateId,
  });
}

export function useAdminPatientResponse(templateId: string, patientId: string) {
  return useQuery<FormResponse | null, Error>({
    queryKey: ['admin-patient-response', templateId, patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('template_id', templateId)
        .eq('patient_id', patientId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!templateId && !!patientId,
  });
}

export function useAdminPatientProfile(patientId: string) {
  return useQuery<Profile | null, Error>({
    queryKey: ['admin-patient-profile', patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', patientId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!patientId,
  });
}
