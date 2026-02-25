import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Plus, Edit, Trash2, Loader2, Save, GripVertical, Download, Upload } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { toast as sonnerToast } from 'sonner';

interface Situation {
  id: string;
  category: string;
  title: string;
  tips: string[] | null;
  sort_order: number | null;
  updated_at: string | null;
}

function ExportSituacionesButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('difficult_situations')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `situaciones-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      sonnerToast.success(`${data.length} situaciones exportadas`);
    } catch (e: any) {
      sonnerToast.error('Error al exportar: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport} disabled={loading} className="gap-1">
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      Exportar
    </Button>
  );
}

function ImportSituacionesButton({ onImported }: { onImported: () => void }) {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const text = await file.text();
      const items = JSON.parse(text);
      if (!Array.isArray(items)) throw new Error('El archivo debe contener un array');
      let imported = 0;
      for (const item of items) {
        const { id, updated_at, ...rest } = item;
        const { error } = await supabase.from('difficult_situations').insert(rest);
        if (error) {
          console.error('Error importing:', item.title, error);
          sonnerToast.error(`Error en "${item.title}": ${error.message}`);
        } else {
          imported++;
        }
      }
      onImported();
      sonnerToast.success(`${imported} de ${items.length} situaciones importadas`);
    } catch (e: any) {
      sonnerToast.error('Error al importar: ' + e.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
      <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={loading} className="gap-1">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        Importar
      </Button>
    </>
  );
}

export default function AdminSituaciones() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [situations, setSituations] = useState<Situation[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSituation, setEditingSituation] = useState<Situation | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    tips: '',
  });

  useEffect(() => {
    fetchSituations();
  }, []);

  const fetchSituations = async () => {
    try {
      const { data, error } = await supabase
        .from('difficult_situations')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setSituations(data || []);
    } catch (error) {
      console.error('Error fetching situations:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las situaciones",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingSituation(null);
    setFormData({
      category: '',
      title: '',
      tips: '',
    });
    setDialogOpen(true);
  };

  const openEditDialog = (situation: Situation) => {
    setEditingSituation(situation);
    setFormData({
      category: situation.category,
      title: situation.title,
      tips: (situation.tips || []).join('\n'),
    });
    setDialogOpen(true);
  };

  const saveSituation = async () => {
    if (!formData.category.trim() || !formData.title.trim()) {
      toast({
        title: "Error",
        description: "La categoría y el título son requeridos",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    const tipsArray = formData.tips.split('\n').filter(tip => tip.trim());

    try {
      if (editingSituation) {
        const { error } = await supabase
          .from('difficult_situations')
          .update({
            category: formData.category,
            title: formData.title,
            tips: tipsArray,
          })
          .eq('id', editingSituation.id);

        if (error) throw error;
        toast({
          title: "Actualizado",
          description: "La situación se ha actualizado correctamente",
        });
      } else {
        const maxOrder = situations.length > 0 
          ? Math.max(...situations.map(s => s.sort_order || 0)) 
          : 0;

        const { error } = await supabase
          .from('difficult_situations')
          .insert({
            category: formData.category,
            title: formData.title,
            tips: tipsArray,
            sort_order: maxOrder + 1,
          });

        if (error) throw error;
        toast({
          title: "Creado",
          description: "La situación se ha creado correctamente",
        });
      }

      setDialogOpen(false);
      fetchSituations();
    } catch (error) {
      console.error('Error saving situation:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la situación",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteSituation = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta situación?')) return;

    try {
      const { error } = await supabase
        .from('difficult_situations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Eliminado",
        description: "La situación se ha eliminado correctamente",
      });
      fetchSituations();
    } catch (error) {
      console.error('Error deleting situation:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la situación",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Situaciones Difíciles
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las guías para situaciones complicadas
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <ExportSituacionesButton />
          <ImportSituacionesButton onImported={fetchSituations} />
          <Button variant="wellness" onClick={openCreateDialog}>
            <Plus className="h-4 w-4" />
            Nueva situación
          </Button>
        </div>
      </div>

      {situations.length === 0 ? (
        <Card wellness>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay situaciones creadas</p>
            <Button variant="wellness" className="mt-4" onClick={openCreateDialog}>
              Crear primera situación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {situations.map((situation) => (
            <Card key={situation.id} wellness>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="text-muted-foreground cursor-move">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {situation.category}
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">{situation.title}</h3>
                    {situation.tips && situation.tips.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {situation.tips.length} consejos
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(situation)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => deleteSituation(situation.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingSituation ? 'Editar situación' : 'Nueva situación'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Categoría</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Ej: Eventos sociales"
              />
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Cenas con amigos o familiares"
              />
            </div>
            <div className="space-y-2">
              <Label>Consejos (uno por línea)</Label>
              <Textarea
                value={formData.tips}
                onChange={(e) => setFormData({ ...formData, tips: e.target.value })}
                placeholder="Come algo ligero antes de ir&#10;Elige opciones más saludables&#10;Controla las porciones"
                rows={6}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="wellness" className="flex-1" onClick={saveSituation} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingSituation ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
