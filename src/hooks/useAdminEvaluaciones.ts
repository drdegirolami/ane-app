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
      // Fetch only necessary fields from profiles
      // IMPORTANT: user_id is the auth user identifier, NOT id
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, status')
        .order('full_name', { ascending: true });

      if (profilesError) {
        throw profilesError;
      }

      if (!profiles || profiles.length === 0) {
        return [];
      }

      // Fetch only necessary fields from responses for this template
      const { data: responses, error: responsesError } = await supabase
        .from('form_responses')
        .select('patient_id, submitted_at, updated_at')
        .eq('template_id', templateId);

      if (responsesError) {
        throw responsesError;
      }

      // Map responses by patient_id for quick lookup
      // patient_id in form_responses matches user_id in profiles
      const responseMap = new Map<string, Pick<FormResponse, 'patient_id' | 'submitted_at' | 'updated_at'>>();
      responses?.forEach((r) => {
        responseMap.set(r.patient_id, r);
      });

      // Combine profiles with their responses using user_id (NOT id)
      return profiles.map((profile) => ({
        profile: profile as Profile,
        response: (responseMap.get(profile.user_id) as FormResponse) || null,
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
