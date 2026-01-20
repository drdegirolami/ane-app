import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileQuestion, HelpCircle } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplateBySlug, FormSchema } from '@/hooks/useFormTemplates';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function EvaluacionDetalle() {
  const { slug } = useParams<{ slug: string }>();
  const { data: template, isLoading, error } = useFormTemplateBySlug(slug ?? '');

  const handleComenzar = () => {
    toast.info('Próximamente podrás completar esta evaluación');
  };

  // Parse schema safely
  const schema = template?.schema_json as unknown as FormSchema | null;

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
        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error al cargar la evaluación</p>
          </div>
        )}

        {/* Not found state */}
        {!isLoading && !error && !template && (
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

        {/* Template content */}
        {!isLoading && !error && template && schema && (
          <>
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">{template.title}</h1>
              {template.description && (
                <p className="text-muted-foreground">{template.description}</p>
              )}
            </div>

            {/* Sections preview */}
            <div className="space-y-4">
              {schema.sections.map((section, sectionIndex) => (
                <Card key={sectionIndex} wellness>
                  <CardHeader>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    {section.description && (
                      <CardDescription>{section.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {section.fields.map((field, fieldIndex) => (
                      <div 
                        key={field.key} 
                        className="p-3 rounded-lg bg-muted/50 space-y-1"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {fieldIndex + 1}. {field.label}
                          </span>
                          {field.required && (
                            <span className="text-xs text-destructive">*</span>
                          )}
                        </div>
                        {field.helpText && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{field.helpText}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button 
                onClick={handleComenzar} 
                size="lg" 
                className="w-full"
              >
                Comenzar
              </Button>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
