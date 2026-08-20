import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2, Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getProgramProgress } from '@/lib/programPhase';

interface ClinicalSession {
  id: string;
  patient_id: string;
  session_date: string;
  session_type: string;
  program_month: number | null;
  motive: string | null;
  evolution: string | null;
  indications: string | null;
  next_steps: string | null;
  alerts: string | null;
  private_notes: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientUserId: string | null;
  patientName: string;
  programStartDate?: string | null;
}

const SESSION_TYPES = [
  { value: 'inicial', label: 'Consulta inicial' },
  { value: 'seguimiento', label: 'Seguimiento' },
  { value: 'control', label: 'Control mensual' },
  { value: 'crisis', label: 'Consulta por crisis' },
  { value: 'cierre', label: 'Cierre de etapa' },
];

const emptyDraft = () => ({
  id: '' as string,
  session_date: new Date().toISOString().slice(0, 10),
  session_type: 'seguimiento',
  motive: '',
  evolution: '',
  indications: '',
  next_steps: '',
  alerts: '',
  private_notes: '',
});

export default function ClinicalSessionsDialog({
  open,
  onOpenChange,
  patientUserId,
  patientName,
  programStartDate,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<ClinicalSession[]>([]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(emptyDraft());

  const load = async () => {
    if (!patientUserId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clinical_sessions')
      .select('*')
      .eq('patient_id', patientUserId)
      .order('session_date', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('No se pudieron cargar las consultas');
    } else {
      setSessions((data ?? []) as ClinicalSession[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (open && patientUserId) {
      setEditing(false);
      setDraft(emptyDraft());
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patientUserId]);

  const startNew = () => {
    setDraft(emptyDraft());
    setEditing(true);
  };

  const startEdit = (s: ClinicalSession) => {
    setDraft({
      id: s.id,
      session_date: s.session_date,
      session_type: s.session_type,
      motive: s.motive ?? '',
      evolution: s.evolution ?? '',
      indications: s.indications ?? '',
      next_steps: s.next_steps ?? '',
      alerts: s.alerts ?? '',
      private_notes: s.private_notes ?? '',
    });
    setEditing(true);
  };

  const save = async () => {
    if (!patientUserId) return;
    setSaving(true);
    const progress = programStartDate ? getProgramProgress(programStartDate) : null;
    const payload = {
      patient_id: patientUserId,
      session_date: draft.session_date,
      session_type: draft.session_type,
      program_month: progress?.month ?? null,
      motive: draft.motive || null,
      evolution: draft.evolution || null,
      indications: draft.indications || null,
      next_steps: draft.next_steps || null,
      alerts: draft.alerts || null,
      private_notes: draft.private_notes || null,
    };

    const { error } = draft.id
      ? await supabase.from('clinical_sessions').update(payload).eq('id', draft.id)
      : await supabase.from('clinical_sessions').insert(payload);

    setSaving(false);
    if (error) {
      console.error(error);
      toast.error('No se pudo guardar la consulta');
      return;
    }
    toast.success('Consulta guardada');
    setEditing(false);
    setDraft(emptyDraft());
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este registro de consulta?')) return;
    const { error } = await supabase.from('clinical_sessions').delete().eq('id', id);
    if (error) {
      toast.error('No se pudo eliminar');
      return;
    }
    toast.success('Consulta eliminada');
    load();
  };

  const typeLabel = (v: string) => SESSION_TYPES.find((t) => t.value === v)?.label ?? v;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Consultas de {patientName}</DialogTitle>
        </DialogHeader>

        {editing ? (
          <div className="space-y-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sessionDate">Fecha</Label>
                <Input
                  id="sessionDate"
                  type="date"
                  className="mt-2"
                  value={draft.session_date}
                  onChange={(e) => setDraft({ ...draft, session_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Tipo de consulta</Label>
                <Select
                  value={draft.session_type}
                  onValueChange={(v) => setDraft({ ...draft, session_type: v })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {SESSION_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="motive">Motivo de la consulta</Label>
              <Textarea id="motive" rows={2} className="mt-2" value={draft.motive}
                onChange={(e) => setDraft({ ...draft, motive: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="evolution">Evolución observada</Label>
              <Textarea id="evolution" rows={3} className="mt-2" value={draft.evolution}
                onChange={(e) => setDraft({ ...draft, evolution: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="indications">Indicaciones dadas</Label>
              <Textarea id="indications" rows={3} className="mt-2" value={draft.indications}
                onChange={(e) => setDraft({ ...draft, indications: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="nextSteps">Próximos pasos</Label>
              <Textarea id="nextSteps" rows={2} className="mt-2" value={draft.next_steps}
                onChange={(e) => setDraft({ ...draft, next_steps: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="alerts">Señales de alerta</Label>
              <Textarea id="alerts" rows={2} className="mt-2" value={draft.alerts}
                onChange={(e) => setDraft({ ...draft, alerts: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="privNotes">Notas privadas</Label>
              <Textarea id="privNotes" rows={2} className="mt-2" value={draft.private_notes}
                onChange={(e) => setDraft({ ...draft, private_notes: e.target.value })} />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button onClick={save} disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar consulta'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <Button onClick={startNew} className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar consulta
            </Button>

            {loading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessions.length === 0 ? (
              <p className="p-6 text-center text-muted-foreground">
                Todavía no hay consultas registradas para este paciente.
              </p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Card key={s.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground">
                          {new Date(`${s.session_date}T12:00:00`).toLocaleDateString('es-ES', {
                            day: 'numeric', month: 'long', year: 'numeric',
                          })}
                        </span>
                        <Badge variant="secondary">{typeLabel(s.session_type)}</Badge>
                        {s.program_month && <Badge variant="outline">Mes {s.program_month}</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(s)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {s.motive && <p className="text-sm"><span className="text-muted-foreground">Motivo: </span>{s.motive}</p>}
                    {s.evolution && <p className="text-sm"><span className="text-muted-foreground">Evolución: </span>{s.evolution}</p>}
                    {s.indications && <p className="text-sm"><span className="text-muted-foreground">Indicaciones: </span>{s.indications}</p>}
                    {s.next_steps && <p className="text-sm"><span className="text-muted-foreground">Próximos pasos: </span>{s.next_steps}</p>}
                    {s.alerts && <p className="text-sm text-destructive">Alerta: {s.alerts}</p>}
                    {s.private_notes && (
                      <p className="text-xs text-muted-foreground italic">Nota privada: {s.private_notes}</p>
                    )}
                  </Card>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
