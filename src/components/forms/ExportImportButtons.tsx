import { useState, useRef } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function ExportButton() {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `evaluaciones-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} evaluaciones exportadas`);
    } catch (e: any) {
      toast.error('Error al exportar: ' + e.message);
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

export function ImportButton() {
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const templates = JSON.parse(text);

      if (!Array.isArray(templates)) throw new Error('El archivo debe contener un array de templates');

      let imported = 0;
      for (const t of templates) {
        // Remove id to let DB generate new ones, keep everything else
        const { id, created_at, ...rest } = t;

        // Upsert by slug to avoid duplicates
        const { error } = await supabase
          .from('form_templates')
          .upsert(
            { ...rest, created_at: created_at || new Date().toISOString() },
            { onConflict: 'slug' }
          );

        if (error) {
          console.error('Error importing template:', t.slug, error);
          toast.error(`Error en "${t.title}": ${error.message}`);
        } else {
          imported++;
        }
      }

      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success(`${imported} de ${templates.length} evaluaciones importadas`);
    } catch (e: any) {
      toast.error('Error al importar: ' + e.message);
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
