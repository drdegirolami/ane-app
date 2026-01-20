import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/components/layout/AppLayout';
import DynamicForm from '@/components/forms/DynamicForm';
import { useFormTemplateBySlug } from '@/hooks/useFormTemplates';
import { useMyFormResponse, useUpsertMyFormResponse } from '@/hooks/useFormResponse';
import { FormSchema } from '@/types/forms';
import { toast } from 'sonner';

export default function EvaluacionInicial() {
  const navigate = useNavigate();
  const [showSuccess, setShowSuccess] = useState(false);

  // Cargar template por slug
  const { data: template, isLoading: loadingTemplate } = useFormTemplateBySlug('evaluacion_inicial');

  // Cargar respuesta existente (si hay)
  const { data: existingResponse, isLoading: loadingResponse } = useMyFormResponse(template?.id || '');

  // Mutation para guardar
  const upsertMutation = useUpsertMyFormResponse();

  const isLoading = loadingTemplate || loadingResponse;
  const hasExistingResponse = !!existingResponse;

  const handleSubmit = async (values: Record<string, unknown>) => {
    if (!template?.id) return;

    try {
      await upsertMutation.mutateAsync({
        templateId: template.id,
        answersJson: values,
      });
      setShowSuccess(true);
    } catch (error) {
      toast.error('Error al guardar. Intentá de nuevo.');
    }
  };

  // Pantalla de éxito (controlada localmente)
  if (showSuccess) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto text-center space-y-6 py-12">
          <CheckCircle className="h-16 w-16 text-primary mx-auto" />
          <h1 className="text-2xl font-display font-bold">¡Gracias!</h1>
          <p className="text-muted-foreground">
            Ya tenemos la información para personalizar tu acompañamiento.
          </p>
          <Button onClick={() => navigate('/')} size="lg">
            Volver al inicio
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Botón volver */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>

        {/* Título */}
        <h1 className="text-3xl font-display font-bold text-foreground">
          Evaluación inicial
        </h1>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {/* Template no encontrado */}
        {!isLoading && !template && (
          <Alert variant="destructive">
            <AlertDescription>
              No se encontró el formulario. Contactá al soporte.
            </AlertDescription>
          </Alert>
        )}

        {/* Aviso si ya completó */}
        {!isLoading && hasExistingResponse && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Ya completaste esta evaluación. Podés editar tus respuestas si lo necesitás.
            </AlertDescription>
          </Alert>
        )}

        {/* Bloque 1: Formulario dinámico */}
        {!isLoading && template && (
          <DynamicForm
            templateId={template.id}
            schema={template.schema_json as unknown as FormSchema}
            initialValues={existingResponse?.answers_json as Record<string, unknown> | undefined}
            onSubmit={handleSubmit}
            isSubmitting={upsertMutation.isPending}
          />
        )}

        {/* Bloque 2: Texto explicativo estático */}
        <Card className="bg-muted/50 border-0">
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">
              Esta evaluación nos ayuda a conocerte mejor para personalizar 
              tu acompañamiento nutricional según tus necesidades y objetivos.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
