import { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AppLayout from '@/components/layout/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface PlanningDocument {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export default function Planning() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<PlanningDocument[]>([]);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('patient_planning')
        .select('id, title, description, file_url, file_name, uploaded_at')
        .eq('patient_id', user.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los documentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const viewDocument = async (doc: PlanningDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('planning-files')
        .createSignedUrl(doc.file_url, 3600);

      if (error) throw error;

      const signed = data?.signedUrl;
      if (!signed) throw new Error('Missing signedUrl');

      const backendUrl = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
      const base = `${backendUrl}/storage/v1`;
      const iframeUrl = signed.startsWith('http') ? signed : `${base}${signed}`;

      setPreviewUrl(iframeUrl);
      setPreviewTitle(doc.title);
      setPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "No se pudo abrir el documento",
        variant: "destructive",
      });
    }
  };

  const downloadDocument = async (doc: PlanningDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('planning-files')
        .download(doc.file_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Mi Planning
          </h1>
          <p className="text-muted-foreground mt-2">
            Aquí encontrarás tus documentos de planning y dieta personalizados.
          </p>
        </section>

        {/* Documents List */}
        <section className="space-y-3 animate-slide-up stagger-1 opacity-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : documents.length === 0 ? (
            <Card wellness>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="font-medium text-foreground mb-2">
                  No tienes documentos aún
                </h3>
                <p className="text-sm text-muted-foreground">
                  Tu nutricionista subirá tu planning personalizado pronto.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              <h2 className="text-lg font-display font-semibold text-foreground">
                Tus documentos
              </h2>
              {documents.map((doc) => (
                <Card key={doc.id} wellness>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate">
                            {doc.title}
                          </h3>
                          {doc.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {doc.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(doc.uploaded_at), "d 'de' MMMM, yyyy", { locale: es })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => viewDocument(doc)}
                          title="Ver"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadDocument(doc)}
                          title="Descargar"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </section>

        {/* Preview Dialog */}
        <Dialog open={previewDialogOpen} onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) {
            setPreviewUrl(null);
          }
        }}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewTitle}</DialogTitle>
            </DialogHeader>
            {previewUrl && (
              <iframe
                src={previewUrl}
                className="w-full h-full rounded-lg"
                title="Vista previa del documento"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
