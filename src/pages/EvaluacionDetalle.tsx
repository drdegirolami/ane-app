import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileQuestion, CheckCircle2, Lock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplateBySlug, FormSchema } from '@/hooks/useFormTemplates';
import { useMyFormResponse, useUpsertMyFormResponse } from '@/hooks/useFormResponse';
import { useMyNextStep } from '@/hooks/useMyNextStep';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import DynamicForm from '@/components/forms/DynamicForm';
import FormReadOnly from '@/components/forms/FormReadOnly';
import { toast } from 'sonner';
import { getScoreResult, hasScoringEnabled } from '@/lib/scoring';
import { ScoreResult } from '@/types/forms';

// Slugs that are locked after first submission (read-only, no edits)
const LOCKED_SLUGS = ['baseline_0_2'];

export default function EvaluacionDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: template, isLoading: loadingTemplate, error: templateError } = useFormTemplateBySlug(slug ?? '');
  
  const templateId = template?.id ?? '';
  const { data: existingResponse, isLoading: loadingResponse } = useMyFormResponse(templateId);
  
  const upsertMutation = useUpsertMyFormResponse();
  const { data: nextStepData, isLoading: nextStepLoading } = useMyNextStep();
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);
  const [scoreResult, setScoreResult] = useState<{ score: number; result: ScoreResult } | null>(null);

  // Parse schema safely
  const schema = template?.schema_json as unknown as FormSchema | null;

  const isLoading = loadingTemplate || (template && loadingResponse);

  // Check if this evaluation is locked (baseline)
  const isLockedSlug = LOCKED_SLUGS.includes(slug ?? '');
  const isLockedAndCompleted = isLockedSlug && !!existingResponse;

  const handleSubmit = async (values: Record<string, unknown>, score?: number) => {
    if (!template || !schema) return;

    try {
      await upsertMutation.mutateAsync({
        templateId: template.id,
        answersJson: values,
        totalScore: score,
      });

      // Si tiene scoring, obtener el resultado
      if (score !== undefined && hasScoringEnabled(schema)) {
        const result = getScoreResult(schema.scoring!, score);
        if (result) {
          setScoreResult({ score, result });
        }
      }

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

        {/* Success state after saving - with score result if applicable */}
        {savedSuccessfully && scoreResult ? (
          // Resultado de test con puntaje
          <Card wellness className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle className="text-2xl">{scoreResult.result.result_title}</CardTitle>
              <CardDescription className="text-base whitespace-pre-line mt-4">
                {scoreResult.result.result_text}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/evaluaciones">
                <Button size="lg" className="w-full">
                  Volver a Evaluaciones
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="w-full">
                  Ir a Inicio
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : savedSuccessfully ? (
          // Resultado genérico (formularios sin scoring)
          <Card wellness className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
              <CardTitle>{schema?.success?.title || '¡Listo!'}</CardTitle>
              <CardDescription className="text-base">
                {schema?.success?.message || 'Tu evaluación fue guardada correctamente.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to={schema?.success?.primaryCtaTo || '/evaluaciones'}>
                <Button size="lg" className="w-full">
                  {schema?.success?.primaryCtaLabel || 'Volver a Evaluaciones'}
                </Button>
              </Link>
              <Link to="/">
                <Button variant="outline" size="lg" className="w-full">
                  Ir a Inicio
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : null}

        {/* LOCKED: Read-only view for baseline evaluations already completed */}
        {!isLoading && !templateError && template && schema && !savedSuccessfully && isLockedAndCompleted && (
          <>
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-muted-foreground">{template.description}</p>
              )}
            </div>

            {/* Locked message */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
              <Lock className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  Tu punto de partida
                </p>
                <p className="text-sm text-muted-foreground">
                  Esto queda como tu punto de partida. No es para juzgarte: es para medir progreso.
                </p>
              </div>
            </div>

            {/* Read-only form */}
            <FormReadOnly schema={schema} answers={initialValues ?? {}} />

            {/* CTA: What's next - connected to real drip data */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">¿Qué sigue ahora?</CardTitle>
                <CardDescription className="text-base">
                  {nextStepLoading ? (
                    'Verificando tu próxima clase…'
                  ) : nextStepData?.available ? (
                    `En la próxima clase: ${nextStepData.next_step_title}`
                  ) : (
                    'Se habilita pronto. Te va a llegar un correo cuando esté lista.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row gap-3">
                {nextStepData?.available ? (
                  <div className="flex-1 space-y-2">
                    <Link to={nextStepData.next_step_url}>
                      <Button size="lg" className="w-full">
                        Continuar
                      </Button>
                    </Link>
                    <p className="text-sm text-muted-foreground text-center">
                      {nextStepData.next_step_title}
                    </p>
                  </div>
                ) : (
                  <Link to="/evaluaciones" className="flex-1">
                    <Button variant="outline" size="lg" className="w-full">
                      Volver a Evaluaciones
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* EDITABLE: Template content - Form (for non-locked or not yet completed) */}
        {!isLoading && !templateError && template && schema && !savedSuccessfully && !isLockedAndCompleted && (
          <>
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-muted-foreground">{template.description}</p>
              )}
            </div>

            {/* Already completed notice (for editable evaluations) */}
            {existingResponse && !isLockedSlug && (
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
