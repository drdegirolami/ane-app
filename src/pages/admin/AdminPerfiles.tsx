import { useState } from 'react';
import { Plus, Pencil, Trash2, Loader2, UserSquare2, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  useClinicalProfiles,
  useSaveClinicalProfile,
  useDeleteClinicalProfile,
  type ClinicalProfile,
} from '@/hooks/useClinicalProfiles';
import { useAllFormTemplates } from '@/hooks/useFormTemplates';

const emptyDraft = {
  id: undefined as string | undefined,
  slug: '',
  name: '',
  description: '',
  patient_text: '',
  show_to_patient: true,
  clinical_attitude: '',
  behavioral_tasks: '',
  warning_signs: '',
  priority_test_slugs: [] as string[],
  sort_order: 0,
  is_active: true,
};

type Draft = typeof emptyDraft;

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export default function AdminPerfiles() {
  const { data: profiles = [], isLoading } = useClinicalProfiles(true);
  const { data: templates = [] } = useAllFormTemplates();
  const saveProfile = useSaveClinicalProfile();
  const deleteProfile = useDeleteClinicalProfile();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const sortedTemplates = [...templates].sort((a, b) => a.title.localeCompare(b.title, 'es'));

  const openNew = () => {
    setDraft({ ...emptyDraft, sort_order: profiles.length + 1 });
    setOpen(true);
  };

  const openEdit = (profile: ClinicalProfile) => {
    setDraft({
      id: profile.id,
      slug: profile.slug,
      name: profile.name,
      description: profile.description ?? '',
      patient_text: profile.patient_text ?? '',
      show_to_patient: profile.show_to_patient,
      clinical_attitude: profile.clinical_attitude ?? '',
      behavioral_tasks: (profile.behavioral_tasks ?? []).join('\n'),
      warning_signs: (profile.warning_signs ?? []).join('\n'),
      priority_test_slugs: profile.priority_test_slugs ?? [],
      sort_order: profile.sort_order,
      is_active: profile.is_active,
    });
    setOpen(true);
  };

  const toLines = (value: string) =>
    value.split('\n').map((l) => l.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!draft.name.trim()) return;
    await saveProfile.mutateAsync({
      id: draft.id,
      slug: draft.slug || slugify(draft.name),
      name: draft.name.trim(),
      description: draft.description,
      patient_text: draft.patient_text,
      show_to_patient: draft.show_to_patient,
      clinical_attitude: draft.clinical_attitude,
      behavioral_tasks: toLines(draft.behavioral_tasks),
      warning_signs: toLines(draft.warning_signs),
      priority_test_slugs: draft.priority_test_slugs,
      sort_order: draft.sort_order,
      is_active: draft.is_active,
    } as Parameters<typeof saveProfile.mutateAsync>[0]);
    setOpen(false);
  };

  const handleDelete = (profile: ClinicalProfile) => {
    if (!window.confirm(`¿Eliminar el perfil "${profile.name}"?`)) return;
    deleteProfile.mutate(profile.id);
  };

  const toggleTest = (slug: string) => {
    setDraft((d) => ({
      ...d,
      priority_test_slugs: d.priority_test_slugs.includes(slug)
        ? d.priority_test_slugs.filter((s) => s !== slug)
        : [...d.priority_test_slugs, slug],
    }));
  };

  const titleForSlug = (slug: string) =>
    templates.find((t) => t.slug === slug)?.title ?? slug;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Perfiles clínicos
          </h1>
          <p className="text-muted-foreground mt-1">
            Perfiles conductuales del método, con sus tests prioritarios y tareas ({profiles.length})
          </p>
        </div>
        <Button variant="wellness" onClick={openNew}>
          <Plus className="h-4 w-4" />
          Nuevo perfil
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-4">
          {profiles.map((profile) => (
            <Card key={profile.id} wellness>
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <UserSquare2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-foreground">{profile.name}</h2>
                        {!profile.is_active && <Badge variant="outline">Inactivo</Badge>}
                        {!profile.show_to_patient && (
                          <Badge variant="outline" className="gap-1">
                            <EyeOff className="h-3 w-3" /> Oculto al paciente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{profile.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(profile)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDelete(profile)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {(profile.priority_test_slugs ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tests prioritarios</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.priority_test_slugs.map((slug) => (
                        <Badge key={slug} variant="secondary" className="font-normal">
                          {titleForSlug(slug)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {(profile.behavioral_tasks ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Tareas conductuales</p>
                    <ul className="list-disc list-inside text-sm text-foreground/80 space-y-0.5">
                      {profile.behavioral_tasks.map((task, i) => (
                        <li key={i}>{task}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile.clinical_attitude && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Actitud clínica</p>
                    <p className="text-sm text-foreground/80">{profile.clinical_attitude}</p>
                  </div>
                )}

                {(profile.warning_signs ?? []).length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Señales de alarma</p>
                    <div className="flex flex-wrap gap-1.5">
                      {profile.warning_signs.map((sign, i) => (
                        <Badge key={i} variant="outline" className="font-normal">
                          {sign}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? 'Editar perfil' : 'Nuevo perfil'}</DialogTitle>
            <DialogDescription>
              Los cambios impactan en las sugerencias y en lo que ve el paciente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="p-name">Nombre del perfil *</Label>
              <Input
                id="p-name"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="El ansioso"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-desc">Descripción clínica</Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-patient">Texto para el paciente</Label>
              <Textarea
                id="p-patient"
                rows={3}
                value={draft.patient_text}
                onChange={(e) => setDraft({ ...draft, patient_text: e.target.value })}
                placeholder="Versión adaptada que ve el paciente en su panel"
              />
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Mostrar al paciente</p>
                  <p className="text-xs text-muted-foreground">
                    Si está apagado, el perfil es solo para uso clínico interno.
                  </p>
                </div>
                <Switch
                  checked={draft.show_to_patient}
                  onCheckedChange={(v) => setDraft({ ...draft, show_to_patient: v })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tests prioritarios</Label>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {sortedTemplates.map((t) => (
                  <label
                    key={t.id}
                    className="flex items-start gap-3 p-3 cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={draft.priority_test_slugs.includes(t.slug)}
                      onCheckedChange={() => toggleTest(t.slug)}
                    />
                    <span className="text-sm leading-tight">{t.title}</span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {draft.priority_test_slugs.length} seleccionados
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-tasks">Tareas conductuales (una por línea)</Label>
              <Textarea
                id="p-tasks"
                rows={4}
                value={draft.behavioral_tasks}
                onChange={(e) => setDraft({ ...draft, behavioral_tasks: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-attitude">Actitud clínica recomendada</Label>
              <Textarea
                id="p-attitude"
                rows={3}
                value={draft.clinical_attitude}
                onChange={(e) => setDraft({ ...draft, clinical_attitude: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-signs">Señales de alarma (una por línea)</Label>
              <Textarea
                id="p-signs"
                rows={3}
                value={draft.warning_signs}
                onChange={(e) => setDraft({ ...draft, warning_signs: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="p-order">Orden</Label>
                <Input
                  id="p-order"
                  type="number"
                  value={draft.sort_order}
                  onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="text-sm font-medium">Activo</span>
                <Switch
                  checked={draft.is_active}
                  onCheckedChange={(v) => setDraft({ ...draft, is_active: v })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveProfile.isPending || !draft.name.trim()}>
              {saveProfile.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
