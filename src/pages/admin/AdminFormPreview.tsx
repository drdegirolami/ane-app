import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, Eye } from 'lucide-react';
import { useFormTemplateBySlugAdmin } from '@/hooks/useFormTemplates';
import { FormSchema, ScoreResult } from '@/types/forms';
import { getScoreResult, hasScoringEnabled } from '@/lib/scoring';
import DynamicForm from '@/components/forms/DynamicForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function AdminFormPreview() {
  const { slug } = useParams<{ slug: string }>();
  const { data: template, isLoading, error } = useFormTemplateBySlugAdmin(slug || '');
  const [previewResult, setPreviewResult] = useState<{
    score: number;
    result: ScoreResult;
  } | null>(null);
  const [submitted, setSubmitted] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="space-y-4">
        <Link to="/admin/evaluaciones">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </Link>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No se encontró el formulario con slug "{slug}"
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const schema = template.schema_json as unknown as FormSchema;
  const isTest = hasScoringEnabled(schema);

  const handlePreviewSubmit = (values: Record<string, unknown>, score?: number) => {
    // Don't save anything - just show the result for tests
    if (isTest && score !== undefined && schema.scoring) {
      const result = getScoreResult(schema.scoring, score);
      if (result) {
        setPreviewResult({ score, result });
      }
    }
    setSubmitted(true);
  };

  const handleReset = () => {
    setPreviewResult(null);
    setSubmitted(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/evaluaciones">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{template.title}</h1>
              <Badge variant="secondary" className="gap-1">
                <Eye className="h-3 w-3" />
                Vista previa
              </Badge>
            </div>
            {template.description && (
              <p className="text-sm text-muted-foreground">{template.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Preview Mode Alert */}
      <Alert>
        <Eye className="h-4 w-4" />
        <AlertTitle>Modo vista previa</AlertTitle>
        <AlertDescription>
          Las respuestas no se guardan. Podés probar el {isTest ? 'test' : 'formulario'} como lo vería un paciente.
        </AlertDescription>
      </Alert>

      {/* Result Screen (for tests) */}
      {submitted && previewResult && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <CardTitle>Resultado del test</CardTitle>
            </div>
            <CardDescription>
              Puntaje obtenido: <span className="font-semibold text-foreground">{previewResult.score} puntos</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-background border">
              <h3 className="font-semibold text-lg mb-2">{previewResult.result.result_title}</h3>
              <p className="text-muted-foreground">{previewResult.result.result_text}</p>
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Reiniciar vista previa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Success Screen (for forms) */}
      {submitted && !previewResult && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <CardTitle>Formulario enviado</CardTitle>
            </div>
            <CardDescription>
              En producción, el paciente vería el mensaje de éxito configurado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleReset} variant="outline" className="w-full">
              Reiniciar vista previa
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {!submitted && (
        <DynamicForm
          templateId={template.id}
          schema={schema}
          onSubmit={handlePreviewSubmit}
          isSubmitting={false}
        />
      )}
    </div>
  );
}
