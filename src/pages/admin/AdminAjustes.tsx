import { useState, useEffect } from 'react';
import { Settings, Save, Loader2, FileText, Edit, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ScreenText {
  id: string;
  screen_key: string;
  title: string | null;
  content: string | null;
  updated_at: string | null;
}

const screenLabels: Record<string, string> = {
  'inicio': 'Inicio',
  'planning': 'Planning',
  'checkin': 'Check-in',
  'situaciones': 'Situaciones',
  'mensaje': 'Mensaje',
  'info': 'Información',
};

export default function AdminAjustes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [screenTexts, setScreenTexts] = useState<ScreenText[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingScreen, setEditingScreen] = useState<ScreenText | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchScreenTexts();
  }, []);

  const fetchScreenTexts = async () => {
    try {
      const { data, error } = await supabase
        .from('screen_texts')
        .select('*')
        .order('screen_key');

      if (error) throw error;
      setScreenTexts(data || []);
    } catch (error) {
      console.error('Error fetching screen texts:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los textos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (screen: ScreenText) => {
    setEditingScreen(screen);
    setFormData({
      title: screen.title || '',
      content: screen.content || '',
    });
    setDialogOpen(true);
  };

  const createScreenText = async (screenKey: string) => {
    try {
      const { data, error } = await supabase
        .from('screen_texts')
        .insert({
          screen_key: screenKey,
          title: screenLabels[screenKey] || screenKey,
          content: '',
        })
        .select()
        .single();

      if (error) throw error;
      
      setEditingScreen(data);
      setFormData({
        title: data.title || '',
        content: data.content || '',
      });
      setDialogOpen(true);
      fetchScreenTexts();
    } catch (error) {
      console.error('Error creating screen text:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el texto",
        variant: "destructive",
      });
    }
  };

  const saveScreenText = async () => {
    if (!editingScreen) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('screen_texts')
        .update({
          title: formData.title,
          content: formData.content,
        })
        .eq('id', editingScreen.id);

      if (error) throw error;
      toast({
        title: "Guardado",
        description: "Los textos se han actualizado correctamente",
      });
      setDialogOpen(false);
      fetchScreenTexts();
    } catch (error) {
      console.error('Error saving screen text:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el texto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const allScreenKeys = Object.keys(screenLabels);

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
            Ajustes
          </h1>
          <p className="text-muted-foreground mt-1">
            Configuración general del programa
          </p>
        </div>
      </div>

      {/* Screen Texts */}
      <Card wellness>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Textos de pantallas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Personaliza los textos que aparecen en cada sección de la aplicación
          </p>
          <div className="space-y-3">
            {allScreenKeys.map((screenKey) => {
              const existingText = screenTexts.find(t => t.screen_key === screenKey);
              
              return (
                <div 
                  key={screenKey}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <span className="font-medium text-foreground">{screenLabels[screenKey]}</span>
                      {existingText && (
                        <p className="text-xs text-muted-foreground">
                          {existingText.title || 'Sin título'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {existingText ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(existingText)}>
                          <Edit className="h-4 w-4" />
                          Editar
                        </Button>
                      </>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => createScreenText(screenKey)}>
                        Configurar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* App Settings Info */}
      <Card wellness>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Información del sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Versión</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="flex justify-between p-3 rounded-xl bg-muted/50">
              <span className="text-muted-foreground">Entorno</span>
              <span className="font-medium text-foreground">Producción</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar textos - {editingScreen && screenLabels[editingScreen.screen_key]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título de la sección</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Título que verán los usuarios"
              />
            </div>
            <div className="space-y-2">
              <Label>Contenido / Descripción</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Texto descriptivo de la sección..."
                rows={6}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="wellness" className="flex-1" onClick={saveScreenText} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
