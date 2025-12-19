import { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit, Trash2, Loader2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface DoctorMessage {
  id: string;
  content: string | null;
  audio_url: string | null;
  is_active: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export default function AdminMensajes() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<DoctorMessage[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMessage, setEditingMessage] = useState<DoctorMessage | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    audio_url: '',
    is_active: true,
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('doctor_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mensajes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openCreateDialog = () => {
    setEditingMessage(null);
    setFormData({
      content: '',
      audio_url: '',
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (message: DoctorMessage) => {
    setEditingMessage(message);
    setFormData({
      content: message.content || '',
      audio_url: message.audio_url || '',
      is_active: message.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const saveMessage = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Error",
        description: "El contenido del mensaje es requerido",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingMessage) {
        const { error } = await supabase
          .from('doctor_messages')
          .update({
            content: formData.content,
            audio_url: formData.audio_url || null,
            is_active: formData.is_active,
          })
          .eq('id', editingMessage.id);

        if (error) throw error;
        toast({
          title: "Actualizado",
          description: "El mensaje se ha actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('doctor_messages')
          .insert({
            content: formData.content,
            audio_url: formData.audio_url || null,
            is_active: formData.is_active,
          });

        if (error) throw error;
        toast({
          title: "Creado",
          description: "El mensaje se ha creado correctamente",
        });
      }

      setDialogOpen(false);
      fetchMessages();
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el mensaje",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este mensaje?')) return;

    try {
      const { error } = await supabase
        .from('doctor_messages')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({
        title: "Eliminado",
        description: "El mensaje se ha eliminado correctamente",
      });
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el mensaje",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (message: DoctorMessage) => {
    try {
      const { error } = await supabase
        .from('doctor_messages')
        .update({ is_active: !message.is_active })
        .eq('id', message.id);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error toggling message:', error);
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
            Mensajes del Médico
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los mensajes semanales para pacientes
          </p>
        </div>
        <Button variant="wellness" onClick={openCreateDialog}>
          <Plus className="h-4 w-4" />
          Nuevo mensaje
        </Button>
      </div>

      {messages.length === 0 ? (
        <Card wellness>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No hay mensajes creados</p>
            <Button variant="wellness" className="mt-4" onClick={openCreateDialog}>
              Crear primer mensaje
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <Card key={message.id} wellness>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        message.is_active 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {message.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                      {message.audio_url && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                          Con audio
                        </span>
                      )}
                    </div>
                    <p className="text-foreground line-clamp-3">{message.content}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {message.created_at && format(new Date(message.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={message.is_active ?? false}
                      onCheckedChange={() => toggleActive(message)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(message)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive"
                      onClick={() => deleteMessage(message.id)}
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
              {editingMessage ? 'Editar mensaje' : 'Nuevo mensaje'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Contenido del mensaje</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Escribe el mensaje para los pacientes..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>URL del audio (opcional)</Label>
              <Input
                value={formData.audio_url}
                onChange={(e) => setFormData({ ...formData, audio_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Mensaje activo</Label>
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button variant="wellness" className="flex-1" onClick={saveMessage} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {editingMessage ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
