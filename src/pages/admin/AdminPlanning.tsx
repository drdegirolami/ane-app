import { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Loader2, Download, User, Eye } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PdfPreviewDialog } from '@/components/pdf/PdfPreviewDialog';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Patient {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
}

interface PlanningDocument {
  id: string;
  patient_id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  uploaded_at: string;
}

export default function AdminPlanning() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [documents, setDocuments] = useState<PlanningDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Preview dialog state
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewFile, setPreviewFile] = useState<Blob | null>(null);

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      fetchDocuments(selectedPatientId);
    } else {
      setDocuments([]);
    }
  }, [selectedPatientId]);

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .order('full_name');

      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error fetching patients:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pacientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (patientId: string) => {
    setLoadingDocs(true);
    try {
      const { data, error } = await supabase
        .from('patient_planning')
        .select('*')
        .eq('patient_id', patientId)
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
      setLoadingDocs(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const uploadDocument = async () => {
    if (!selectedPatientId || !selectedFile || !uploadTitle.trim()) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated');

      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${selectedPatientId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('planning-files')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('planning-files')
        .getPublicUrl(fileName);

      // Insert record in database
      const { error: insertError } = await supabase
        .from('patient_planning')
        .insert({
          patient_id: selectedPatientId,
          title: uploadTitle.trim(),
          description: uploadDescription.trim() || null,
          file_url: fileName,
          file_name: selectedFile.name,
          uploaded_by: user.id,
        });

      if (insertError) throw insertError;

      toast({
        title: "Éxito",
        description: "Documento subido correctamente",
      });

      // Reset form and refresh
      setUploadDialogOpen(false);
      setUploadTitle('');
      setUploadDescription('');
      setSelectedFile(null);
      fetchDocuments(selectedPatientId);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const viewDocument = async (doc: PlanningDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from('planning-files')
        .download(doc.file_url);

      if (error) throw error;

      const pdfBlob = data.type === 'application/pdf' ? data : data.slice(0, data.size, 'application/pdf');
      setPreviewFile(pdfBlob);
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

  const deleteDocument = async (doc: PlanningDocument) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('planning-files')
        .remove([doc.file_url]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('patient_planning')
        .delete()
        .eq('id', doc.id);

      if (dbError) throw dbError;

      toast({
        title: "Eliminado",
        description: "Documento eliminado correctamente",
      });

      fetchDocuments(selectedPatientId);
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el documento",
        variant: "destructive",
      });
    }
  };

  const selectedPatient = patients.find(p => p.user_id === selectedPatientId);

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
            Planning de Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona los documentos de planning y dieta de cada paciente
          </p>
        </div>
      </div>

      {/* Patient selector */}
      <Card wellness>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Seleccionar Paciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Selecciona un paciente" />
            </SelectTrigger>
            <SelectContent>
              {patients.map((patient) => (
                <SelectItem key={patient.user_id} value={patient.user_id}>
                  {patient.full_name || patient.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Documents section - only show when patient selected */}
      {selectedPatientId && (
        <Card wellness>
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Documentos de {selectedPatient?.full_name || 'Paciente'}
              </CardTitle>
              <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="wellness">
                    <Upload className="h-4 w-4" />
                    Subir Planning
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Subir nuevo planning</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Título *</Label>
                      <Input
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="Ej: Dieta semana 1"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Descripción</Label>
                      <Textarea
                        value={uploadDescription}
                        onChange={(e) => setUploadDescription(e.target.value)}
                        placeholder="Descripción opcional del documento"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Archivo PDF *</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                      />
                      {selectedFile && (
                        <p className="text-sm text-muted-foreground">
                          Archivo seleccionado: {selectedFile.name}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={uploadDocument}
                      disabled={uploading || !uploadTitle.trim() || !selectedFile}
                      className="w-full"
                      variant="wellness"
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Subir documento
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No hay documentos para este paciente</p>
                <p className="text-sm">Sube el primer planning usando el botón de arriba</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/50"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{doc.title}</h4>
                        {doc.description && (
                          <p className="text-sm text-muted-foreground truncate">
                            {doc.description}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(doc.uploaded_at), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDocument(doc)}
                        className="text-destructive hover:text-destructive"
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      <PdfPreviewDialog
        open={previewDialogOpen}
        onOpenChange={(open) => {
          setPreviewDialogOpen(open);
          if (!open) setPreviewFile(null);
        }}
        title={previewTitle}
        file={previewFile}
      />
    </div>
  );
}
