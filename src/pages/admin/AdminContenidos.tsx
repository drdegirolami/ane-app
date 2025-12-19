import { useState, useEffect } from 'react';
import { FileText, Upload, Edit, Trash2, File, Video, Music, Loader2, Plus, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ContentFile {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  file_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ScreenText {
  id: string;
  screen_key: string;
  title: string | null;
  content: string | null;
}

const fileTypeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  pdf: FileText,
  video: Video,
  audio: Music,
  text: File,
};

const fileTypeLabels: Record<string, string> = {
  pdf: 'PDFs',
  video: 'Videos',
  audio: 'Audios',
  text: 'Textos',
};

const screenLabels: Record<string, string> = {
  'inicio': 'Inicio',
  'planning': 'Planning',
  'checkin': 'Check-in',
  'situaciones': 'Situaciones',
  'mensaje': 'Mensaje',
  'info': 'Información',
};

export default function AdminContenidos() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<ContentFile[]>([]);
  const [screenTexts, setScreenTexts] = useState<ScreenText[]>([]);
  const [fileDialogOpen, setFileDialogOpen] = useState(false);
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const [editingFile, setEditingFile] = useState<ContentFile | null>(null);
  const [editingText, setEditingText] = useState<ScreenText | null>(null);
  const [saving, setSaving] = useState(false);
  
  const [fileFormData, setFileFormData] = useState({
    name: '',
    description: '',
    file_type: 'pdf',
    file_url: '',
  });
  
  const [textFormData, setTextFormData] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [filesRes, textsRes] = await Promise.all([
        supabase.from('content_files').select('*').order('created_at', { ascending: false }),
        supabase.from('screen_texts').select('*').order('screen_key'),
      ]);

      if (filesRes.error) throw filesRes.error;
      if (textsRes.error) throw textsRes.error;

      setFiles(filesRes.data || []);
      setScreenTexts(textsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los contenidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getFileTypeCounts = () => {
    const counts: Record<string, number> = { pdf: 0, video: 0, audio: 0, text: 0 };
    files.forEach(file => {
      if (counts[file.file_type] !== undefined) {
        counts[file.file_type]++;
      }
    });
    return counts;
  };

  const openCreateFileDialog = () => {
    setEditingFile(null);
    setFileFormData({ name: '', description: '', file_type: 'pdf', file_url: '' });
    setFileDialogOpen(true);
  };

  const openEditFileDialog = (file: ContentFile) => {
    setEditingFile(file);
    setFileFormData({
      name: file.name,
      description: file.description || '',
      file_type: file.file_type,
      file_url: file.file_url || '',
    });
    setFileDialogOpen(true);
  };

  const saveFile = async () => {
    if (!fileFormData.name.trim()) {
      toast({ title: "Error", description: "El nombre es requerido", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingFile) {
        const { error } = await supabase
          .from('content_files')
          .update({
            name: fileFormData.name,
            description: fileFormData.description || null,
            file_type: fileFormData.file_type,
            file_url: fileFormData.file_url || null,
          })
          .eq('id', editingFile.id);

        if (error) throw error;
        toast({ title: "Actualizado", description: "El archivo se ha actualizado" });
      } else {
        const { error } = await supabase
          .from('content_files')
          .insert({
            name: fileFormData.name,
            description: fileFormData.description || null,
            file_type: fileFormData.file_type,
            file_url: fileFormData.file_url || null,
          });

        if (error) throw error;
        toast({ title: "Creado", description: "El archivo se ha creado" });
      }

      setFileDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving file:', error);
      toast({ title: "Error", description: "No se pudo guardar el archivo", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const deleteFile = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este archivo?')) return;

    try {
      const { error } = await supabase.from('content_files').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Eliminado", description: "El archivo se ha eliminado" });
      fetchData();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({ title: "Error", description: "No se pudo eliminar el archivo", variant: "destructive" });
    }
  };

  const openEditTextDialog = (text: ScreenText) => {
    setEditingText(text);
    setTextFormData({ title: text.title || '', content: text.content || '' });
    setTextDialogOpen(true);
  };

  const createScreenText = async (screenKey: string) => {
    try {
      const { data, error } = await supabase
        .from('screen_texts')
        .insert({ screen_key: screenKey, title: screenLabels[screenKey], content: '' })
        .select()
        .single();

      if (error) throw error;
      openEditTextDialog(data);
      fetchData();
    } catch (error) {
      console.error('Error creating screen text:', error);
      toast({ title: "Error", description: "No se pudo crear el texto", variant: "destructive" });
    }
  };

  const saveScreenText = async () => {
    if (!editingText) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('screen_texts')
        .update({ title: textFormData.title, content: textFormData.content })
        .eq('id', editingText.id);

      if (error) throw error;
      toast({ title: "Guardado", description: "El texto se ha actualizado" });
      setTextDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving screen text:', error);
      toast({ title: "Error", description: "No se pudo guardar el texto", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const counts = getFileTypeCounts();

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
            Contenidos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de materiales del programa
          </p>
        </div>
        <Button variant="wellness" onClick={openCreateFileDialog}>
          <Plus className="h-4 w-4" />
          Nuevo archivo
        </Button>
      </div>

      {/* Content Types */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(fileTypeLabels).map(([type, label]) => {
          const Icon = fileTypeIcons[type];
          return (
            <Card key={type} wellness className="cursor-pointer hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-2xl font-display font-bold text-foreground">
                    {counts[type]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Screen Texts */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Textos de pantallas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(screenLabels).map(([key, label]) => {
              const existingText = screenTexts.find(t => t.screen_key === key);
              return (
                <div 
                  key={key}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                >
                  <span className="font-medium text-foreground">{label}</span>
                  {existingText ? (
                    <Button variant="ghost" size="sm" onClick={() => openEditTextDialog(existingText)}>
                      <Edit className="h-4 w-4" />
                      Editar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => createScreenText(key)}>
                      Configurar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Content */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Archivos ({files.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="py-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No hay archivos creados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => {
                const Icon = fileTypeIcons[file.file_type] || File;
                return (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {file.updated_at && format(new Date(file.updated_at), "d MMM yyyy", { locale: es })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditFileDialog(file)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteFile(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Dialog */}
      <Dialog open={fileDialogOpen} onOpenChange={setFileDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingFile ? 'Editar archivo' : 'Nuevo archivo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={fileFormData.name}
                onChange={(e) => setFileFormData({ ...fileFormData, name: e.target.value })}
                placeholder="Nombre del archivo"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={fileFormData.file_type} onValueChange={(v) => setFileFormData({ ...fileFormData, file_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="text">Texto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL del archivo</Label>
              <Input
                value={fileFormData.file_url}
                onChange={(e) => setFileFormData({ ...fileFormData, file_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea
                value={fileFormData.description}
                onChange={(e) => setFileFormData({ ...fileFormData, description: e.target.value })}
                placeholder="Descripción opcional"
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setFileDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="wellness" className="flex-1" onClick={saveFile} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingFile ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Text Dialog */}
      <Dialog open={textDialogOpen} onOpenChange={setTextDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Editar textos - {editingText && screenLabels[editingText.screen_key]}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={textFormData.title}
                onChange={(e) => setTextFormData({ ...textFormData, title: e.target.value })}
                placeholder="Título de la sección"
              />
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea
                value={textFormData.content}
                onChange={(e) => setTextFormData({ ...textFormData, content: e.target.value })}
                placeholder="Contenido de la sección..."
                rows={6}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setTextDialogOpen(false)}>
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