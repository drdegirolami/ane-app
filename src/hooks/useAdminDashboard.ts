import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getProgramProgress } from '@/lib/programPhase';

export type AlertLevel = 'high' | 'medium' | 'low';

export interface PatientAlert {
  level: AlertLevel;
  label: string;
}

export interface DashboardPatient {
  userId: string;
  name: string;
  email: string | null;
  status: string;
  startDate: string | null;
  month: number | null;
  phase: 1 | 2 | 3 | null;
  phaseLabel: string;
  finished: boolean;
  lastCheckinAt: string | null;
  lastAnxiety: number | null;
  lastResponseAt: string | null;
  lastSessionAt: string | null;
  hasProfileAssigned: boolean;
  alerts: PatientAlert[];
}

export interface DashboardData {
  patients: DashboardPatient[];
  totals: {
    active: number;
    checkinsThisWeek: number;
    responsesThisWeek: number;
    withAlerts: number;
    withoutProfile: number;
    finished: number;
  };
  phaseCounts: { phase: number; count: number }[];
}

const DAY = 1000 * 60 * 60 * 24;
const daysSince = (iso: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / DAY) : null;

export function useAdminDashboard() {
  return useQuery<DashboardData, Error>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [profilesRes, rolesRes, checkinsRes, responsesRes, sessionsRes, assignmentsRes] =
        await Promise.all([
          supabase
            .from('profiles')
            .select('user_id, full_name, email, status, program_start_date'),
          supabase.from('user_roles').select('user_id, role'),
          supabase
            .from('checkins')
            .select('user_id, created_at, anxiety_level')
            .order('created_at', { ascending: false }),
          supabase
            .from('form_responses')
            .select('patient_id, submitted_at')
            .order('submitted_at', { ascending: false }),
          supabase
            .from('clinical_sessions')
            .select('patient_id, session_date')
            .order('session_date', { ascending: false }),
          supabase
            .from('patient_profile_assignments')
            .select('patient_id, primary_profile_id'),
        ]);

      const err =
        profilesRes.error ||
        rolesRes.error ||
        checkinsRes.error ||
        responsesRes.error ||
        sessionsRes.error ||
        assignmentsRes.error;
      if (err) throw err;

      const adminIds = new Set(
        (rolesRes.data ?? []).filter((r) => r.role === 'admin').map((r) => r.user_id),
      );

      const firstBy = <T,>(rows: T[] | null, key: keyof T) => {
        const map = new Map<string, T>();
        (rows ?? []).forEach((row) => {
          const id = String(row[key]);
          if (!map.has(id)) map.set(id, row);
        });
        return map;
      };

      const lastCheckin = firstBy(checkinsRes.data, 'user_id' as never) as Map<
        string,
        { created_at: string | null; anxiety_level: number | null }
      >;
      const lastResponse = firstBy(responsesRes.data, 'patient_id' as never) as Map<
        string,
        { submitted_at: string | null }
      >;
      const lastSession = firstBy(sessionsRes.data, 'patient_id' as never) as Map<
        string,
        { session_date: string | null }
      >;
      const assigned = new Set(
        (assignmentsRes.data ?? [])
          .filter((a) => a.primary_profile_id)
          .map((a) => a.patient_id),
      );

      const weekAgo = Date.now() - 7 * DAY;

      const patients: DashboardPatient[] = (profilesRes.data ?? [])
        .filter((p) => !adminIds.has(p.user_id))
        .map((p) => {
          const progress = getProgramProgress(p.program_start_date);
          const checkin = lastCheckin.get(p.user_id);
          const lastCheckinAt = checkin?.created_at ?? null;
          const lastAnxiety = checkin?.anxiety_level ?? null;
          const lastResponseAt = lastResponse.get(p.user_id)?.submitted_at ?? null;
          const lastSessionAt = lastSession.get(p.user_id)?.session_date ?? null;
          const hasProfileAssigned = assigned.has(p.user_id);

          const alerts: PatientAlert[] = [];
          const dCheckin = daysSince(lastCheckinAt);
          if (p.status === 'active') {
            if (dCheckin === null) {
              alerts.push({ level: 'medium', label: 'Nunca hizo un check-in' });
            } else if (dCheckin >= 14) {
              alerts.push({ level: 'high', label: `Sin check-in hace ${dCheckin} días` });
            } else if (dCheckin >= 10) {
              alerts.push({ level: 'medium', label: `Sin check-in hace ${dCheckin} días` });
            }
            if (lastAnxiety !== null && lastAnxiety >= 8) {
              alerts.push({ level: 'high', label: `Ansiedad alta (${lastAnxiety}/10)` });
            }
            if (!p.program_start_date) {
              alerts.push({ level: 'medium', label: 'Sin fecha de inicio del programa' });
            }
            if (!hasProfileAssigned) {
              alerts.push({ level: 'medium', label: 'Sin perfil clínico asignado' });
            }
            if (!lastResponseAt) {
              alerts.push({ level: 'low', label: 'Sin evaluaciones completadas' });
            }
            const dSession = daysSince(lastSessionAt);
            if (p.program_start_date && (dSession === null || dSession >= 45)) {
              alerts.push({
                level: 'low',
                label: dSession === null ? 'Sin consultas registradas' : `Última consulta hace ${dSession} días`,
              });
            }
            if (progress.finished) {
              alerts.push({ level: 'low', label: 'Programa de 6 meses completado' });
            }
          }

          return {
            userId: p.user_id,
            name: p.full_name || p.email || 'Sin nombre',
            email: p.email,
            status: p.status ?? 'active',
            startDate: p.program_start_date,
            month: progress.month,
            phase: progress.phase,
            phaseLabel: progress.label,
            finished: progress.finished,
            lastCheckinAt,
            lastAnxiety,
            lastResponseAt,
            lastSessionAt,
            hasProfileAssigned,
            alerts,
          };
        });

      const activePatients = patients.filter((p) => p.status === 'active');

      const checkinsThisWeek = (checkinsRes.data ?? []).filter(
        (c) => c.created_at && new Date(c.created_at).getTime() >= weekAgo,
      ).length;
      const responsesThisWeek = (responsesRes.data ?? []).filter(
        (r) => r.submitted_at && new Date(r.submitted_at).getTime() >= weekAgo,
      ).length;

      const phaseCounts = [1, 2, 3].map((phase) => ({
        phase,
        count: activePatients.filter((p) => !p.finished && p.phase === phase).length,
      }));

      return {
        patients,
        totals: {
          active: activePatients.length,
          checkinsThisWeek,
          responsesThisWeek,
          withAlerts: activePatients.filter((p) => p.alerts.length > 0).length,
          withoutProfile: activePatients.filter((p) => !p.hasProfileAssigned).length,
          finished: activePatients.filter((p) => p.finished).length,
        },
        phaseCounts,
      };
    },
  });
}
