import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';
import type { FormSchema } from '@/types/forms';

// Re-exportar tipos desde el archivo compartido
export type { FormField, FormSection, FormSchema, FormFieldOption } from '@/types/forms';

export type FormTemplate = Database['public']['Tables']['form_templates']['Row'];

export function useFormTemplates() {
  return useQuery<FormTemplate[], Error>({
    queryKey: ['form-templates', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

// Hook for admin to see ALL templates (including drafts)
export function useAllFormTemplates() {
  return useQuery<FormTemplate[], Error>({
    queryKey: ['form-templates', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .order('is_active', { ascending: false }) // Active first, then drafts
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }

      return data ?? [];
    },
  });
}

export function useFormTemplateBySlug(slug: string) {
  return useQuery<FormTemplate | null, Error>({
    queryKey: ['form-template', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });
}

// Hook for admin to preview any template (including drafts)
export function useFormTemplateBySlugAdmin(slug: string) {
  return useQuery<FormTemplate | null, Error>({
    queryKey: ['form-template-admin', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return data;
    },
    enabled: !!slug,
  });
}

// Update form template mutation
interface UpdateTemplateArgs {
  id: string;
  title: string;
  description: string | null;
  schemaJson: FormSchema;
}

// Publish (activate) a draft template
export function usePublishFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const { error } = await supabase
        .from('form_templates')
        .update({ is_active: true })
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success('Test publicado correctamente');
    },
    onError: (error) => {
      console.error('Error publishing template:', error);
      toast.error('Error al publicar el test');
    },
  });
}

export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title, description, schemaJson }: UpdateTemplateArgs) => {
      const { error } = await supabase
        .from('form_templates')
        .update({
          title,
          description,
          schema_json: schemaJson as unknown as Database['public']['Tables']['form_templates']['Update']['schema_json'],
          is_active: false, // Mark as draft after editing, requires re-publish
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      queryClient.invalidateQueries({ queryKey: ['form-template'] });
      toast.success('Formulario actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating template:', error);
      toast.error('Error al actualizar el formulario');
    },
  });
}

// Delete form template mutation
export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      // First delete associated responses
      const { error: responsesError } = await supabase
        .from('form_responses')
        .delete()
        .eq('template_id', templateId);

      if (responsesError) throw responsesError;

      // Then delete the template
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success('Formulario eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting template:', error);
      toast.error('Error al eliminar el formulario');
    },
  });
}
