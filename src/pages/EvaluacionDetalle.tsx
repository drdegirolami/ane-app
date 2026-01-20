import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileQuestion, CheckCircle2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplateBySlug, FormSchema } from '@/hooks/useFormTemplates';
import { useMyFormResponse, useUpsertMyFormResponse } from '@/hooks/useFormResponse';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import DynamicForm from '@/components/forms/DynamicForm';
import { toast } from 'sonner';

export default function EvaluacionDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: template, isLoading: loadingTemplate, error: templateError } = useFormTemplateBySlug(slug ?? '');
  
  const templateId = template?.id ?? '';
  const { data: existingResponse, isLoading: loadingResponse } = useMyFormResponse(templateId);
  
  const upsertMutation = useUpsertMyFormResponse();
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  // Parse schema safely
  const schema = template?.schema_json as unknown as FormSchema | null;

  const isLoading = loadingTemplate || (template && loadingResponse);

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!template) return;

    try {
      await upsertMutation.mutateAsync({
        templateId: template.id,
        answersJson: values,
      });
      setSavedSuccessfully(true);
      toast.success('¡Evaluación guardada correctamente!');
    } catch (error) {
      console.error('Error saving response:', error);
      toast.error('Error al guardar la evaluación');
    }
  };

  // Get initial values from existing response
  const initialValues = existingResponse?.answers_json as Record<string, unknown> | undefined;

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        {/* Back link */}
        <Link 
          to="/evaluaciones" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Evaluaciones
        </Link>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Error state */}
        {templateError && (
          <div className="text-center py-12">
            <p className="text-destructive">Error al cargar la evaluación</p>
          </div>
        )}

        {/* Not found state */}
        {!isLoading && !templateError && !template && (
          <div className="text-center py-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Evaluación no encontrada</p>
            <Link to="/evaluaciones">
              <Button variant="outline" className="mt-4">
                Volver a Evaluaciones
              </Button>
            </Link>
          </div>
        )}

        {/* Success state after saving */}
        {savedSuccessfully && schema && (
          <Card wellness className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle>{schema.success.title}</CardTitle>
              <CardDescription className="text-base">
                {schema.success.message}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to={schema.success.primaryCtaTo}>
                <Button size="lg" className="w-full">
                  {schema.success.primaryCtaLabel}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Template content - Form */}
        {!isLoading && !templateError && template && schema && !savedSuccessfully && (
          <>
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-muted-foreground">{template.description}</p>
              )}
            </div>

            {/* Already completed notice */}
            {existingResponse && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary text-sm">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Ya completaste esta evaluación. Podés editar tus respuestas.</span>
              </div>
            )}

            {/* Dynamic Form */}
            <DynamicForm
              templateId={template.id}
              schema={schema}
              initialValues={initialValues}
              onSubmit={handleSubmit}
              isSubmitting={upsertMutation.isPending}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
}
