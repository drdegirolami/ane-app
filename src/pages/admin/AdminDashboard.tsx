import { Users, CheckCircle, AlertTriangle, UserCog, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { useAdminDashboard, type AlertLevel, type DashboardPatient } from '@/hooks/useAdminDashboard';

const PHASE_NAMES: Record<number, string> = {
  1: 'Fase 1 · Arranque',
  2: 'Fase 2 · Sostener el cambio',
  3: 'Fase 3 · Consolidar la identidad',
};

const LEVEL_ORDER: Record<AlertLevel, number> = { high: 0, medium: 1, low: 2 };

const levelClass: Record<AlertLevel, string> = {
  high: 'border-destructive/40 bg-destructive/10 text-destructive',
  medium: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
  low: 'border-border bg-muted text-muted-foreground',
};

const topLevel = (p: DashboardPatient): AlertLevel =>
  p.alerts.reduce<AlertLevel>((acc, a) => (LEVEL_ORDER[a.level] < LEVEL_ORDER[acc] ? a.level : acc), 'low');

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : '—';

export default function AdminDashboard() {
  const { data, isLoading, error } = useAdminDashboard();

  const stats = [
    { label: 'Pacientes activos', value: data?.totals.active ?? 0, icon: Users, color: 'text-primary' },
    { label: 'Check-ins (7 días)', value: data?.totals.checkinsThisWeek ?? 0, icon: CheckCircle, color: 'text-green-500' },
    { label: 'Pacientes con alertas', value: data?.totals.withAlerts ?? 0, icon: AlertTriangle, color: 'text-amber-500' },
    { label: 'Sin perfil clínico', value: data?.totals.withoutProfile ?? 0, icon: UserCog, color: 'text-primary' },
  ];

  const alerted = (data?.patients ?? [])
    .filter((p) => p.status === 'active' && p.alerts.length > 0)
    .sort((a, b) => {
      const diff = LEVEL_ORDER[topLevel(a)] - LEVEL_ORDER[topLevel(b)];
      return diff !== 0 ? diff : b.alerts.length - a.alerts.length;
    });

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Dashboard clínico</h1>
        <p className="text-muted-foreground mt-1">Estado del programa y pacientes que requieren atención</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Cargando datos…
        </div>
      )}
      {error && <p className="text-sm text-destructive">No se pudieron cargar los datos: {error.message}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} wellness>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribución por fase */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Pacientes por fase del programa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {(data?.phaseCounts ?? [1, 2, 3].map((phase) => ({ phase, count: 0 }))).map((p) => (
              <div key={p.phase} className="rounded-lg border border-border p-4">
                <p className="text-sm text-muted-foreground">{PHASE_NAMES[p.phase]}</p>
                <p className="text-2xl font-display font-bold text-foreground mt-1">{p.count}</p>
              </div>
            ))}
          </div>
          {(data?.totals.finished ?? 0) > 0 && (
            <p className="text-sm text-muted-foreground mt-4">
              {data?.totals.finished} paciente(s) superaron los 6 meses del programa.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Alertas */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Alertas clínicas</CardTitle>
        </CardHeader>
        <CardContent>
          {!isLoading && alerted.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay alertas activas. Todo en orden.</p>
          )}
          <div className="space-y-4">
            {alerted.map((p) => (
              <div key={p.userId} className="rounded-lg border border-border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{p.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.phaseLabel} · Último check-in: {fmt(p.lastCheckinAt)} · Última consulta: {fmt(p.lastSessionAt)}
                    </p>
                  </div>
                  <Link to="/admin/pacientes">
                    <Button variant="soft" size="sm">Ver paciente</Button>
                  </Link>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {p.alerts.map((a, i) => (
                    <Badge key={i} variant="outline" className={levelClass[a.level]}>
                      {a.label}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/pacientes">
              <Button variant="soft">Agregar paciente</Button>
            </Link>
            <Link to="/admin/mensajes">
              <Button variant="soft">Nuevo mensaje semanal</Button>
            </Link>
            <Link to="/admin/planning">
              <Button variant="soft">Editar planning</Button>
            </Link>
            <Link to="/admin/evaluaciones">
              <Button variant="soft">Evaluaciones</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
