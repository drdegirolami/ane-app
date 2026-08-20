import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

export type ClinicalProfile = Database['public']['Tables']['clinical_profiles']['Row'];
export type ProfileAssignment = Database['public']['Tables']['patient_profile_assignments']['Row'];

export function useClinicalProfiles(includeInactive = false) {
  return useQuery<ClinicalProfile[], Error>({
    queryKey: ['clinical-profiles', includeInactive],
    queryFn: async () => {
      let query = supabase.from('clinical_profiles').select('*').order('sort_order');
      if (!includeInactive) query = query.eq('is_active', true);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveClinicalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: Partial<ClinicalProfile> & { name: string; slug: string }) => {
      const payload = {
        slug: profile.slug,
        name: profile.name,
        description: profile.description ?? null,
        patient_text: profile.patient_text ?? null,
        show_to_patient: profile.show_to_patient ?? true,
        clinical_attitude: profile.clinical_attitude ?? null,
        behavioral_tasks: profile.behavioral_tasks ?? [],
        warning_signs: profile.warning_signs ?? [],
        priority_test_slugs: profile.priority_test_slugs ?? [],
        sort_order: profile.sort_order ?? 0,
        is_active: profile.is_active ?? true,
      };

      if (profile.id) {
        const { error } = await supabase.from('clinical_profiles').update(payload).eq('id', profile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('clinical_profiles').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profiles'] });
      toast.success('Perfil guardado');
    },
    onError: (error: Error) => toast.error('Error al guardar el perfil: ' + error.message),
  });
}

export function useDeleteClinicalProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clinical_profiles').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clinical-profiles'] });
      toast.success('Perfil eliminado');
    },
    onError: (error: Error) => toast.error('Error al eliminar: ' + error.message),
  });
}

// Última asignación de perfil de un paciente
export function usePatientProfileAssignment(patientUserId: string | null | undefined) {
  return useQuery<ProfileAssignment | null, Error>({
    queryKey: ['profile-assignment', patientUserId],
    queryFn: async () => {
      if (!patientUserId) return null;
      const { data, error } = await supabase
        .from('patient_profile_assignments')
        .select('*')
        .eq('patient_id', patientUserId)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!patientUserId,
  });
}

export function useAssignPatientProfile() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (args: {
      patientId: string;
      primaryProfileId: string | null;
      secondaryProfileId: string | null;
      notes?: string | null;
    }) => {
      const { error } = await supabase.from('patient_profile_assignments').insert({
        patient_id: args.patientId,
        primary_profile_id: args.primaryProfileId,
        secondary_profile_id: args.secondaryProfileId,
        notes: args.notes ?? null,
        assigned_by: user?.id ?? null,
        source: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ['profile-assignment', vars.patientId] });
      queryClient.invalidateQueries({ queryKey: ['profile-assignments'] });
      toast.success('Perfil asignado');
    },
    onError: (error: Error) => toast.error('Error al asignar el perfil: ' + error.message),
  });
}

// Asignaciones vigentes de todos los pacientes (para la grilla)
export function useAllCurrentAssignments() {
  return useQuery<Record<string, ProfileAssignment>, Error>({
    queryKey: ['profile-assignments', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_profile_assignments')
        .select('*')
        .order('assigned_at', { ascending: false });
      if (error) throw error;

      const latest: Record<string, ProfileAssignment> = {};
      for (const row of data ?? []) {
        if (!latest[row.patient_id]) latest[row.patient_id] = row;
      }
      return latest;
    },
  });
}

// Perfil propio del paciente (texto adaptado)
export function useMyClinicalProfile() {
  const { user } = useAuth();

  return useQuery<{ assignment: ProfileAssignment; primary: ClinicalProfile | null; secondary: ClinicalProfile | null } | null, Error>({
    queryKey: ['my-clinical-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data: assignment, error } = await supabase
        .from('patient_profile_assignments')
        .select('*')
        .eq('patient_id', user.id)
        .order('assigned_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!assignment) return null;

      const ids = [assignment.primary_profile_id, assignment.secondary_profile_id].filter(Boolean) as string[];
      if (ids.length === 0) return { assignment, primary: null, secondary: null };

      const { data: profiles } = await supabase
        .from('clinical_profiles')
        .select('*')
        .in('id', ids)
        .eq('is_active', true)
        .eq('show_to_patient', true);

      const byId = new Map((profiles ?? []).map((p) => [p.id, p]));
      return {
        assignment,
        primary: assignment.primary_profile_id ? byId.get(assignment.primary_profile_id) ?? null : null,
        secondary: assignment.secondary_profile_id ? byId.get(assignment.secondary_profile_id) ?? null : null,
      };
    },
    enabled: !!user?.id,
  });
}
