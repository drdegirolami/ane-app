import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Check, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { useMyFormResponses } from '@/hooks/useFormResponse';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Evaluaciones() {
  const { data: templates, isLoading, error } = useFormTemplates();
  const { data: responses } = useMyFormResponses();

  const completedTemplateIds = new Set(responses?.map((r) => r.template_id) || []);

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Evaluaciones</h1>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-destructive">Error al cargar evaluaciones</p>
          </div>
        )}

        {!isLoading && !error && templates?.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Todavía no hay evaluaciones disponibles</p>
          </div>
        )}

        {!isLoading && !error && templates && templates.length > 0 && (
          <div className="grid gap-4">
            {templates.map((template) => {
              const isCompleted = completedTemplateIds.has(template.id);

              return (
                <Card key={template.id} wellness className="hover:scale-[1.01] transition-transform">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <CardTitle>{template.title}</CardTitle>
                        {template.description && (
                          <CardDescription>{template.description}</CardDescription>
                        )}
                      </div>
                      <Badge
                        variant={isCompleted ? 'default' : 'secondary'}
                        className={isCompleted 
                          ? 'bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20' 
                          : 'bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20'
                        }
                      >
                        {isCompleted ? (
                          <>
                            <Check className="h-3 w-3 mr-1" />
                            Completado
                          </>
                        ) : (
                          'Pendiente'
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardFooter>
                    <Link to={`/evaluaciones/${template.slug}`} className="ml-auto">
                      <Button variant="default" size="sm" className="gap-2">
                        {isCompleted ? 'Ver' : 'Completar'}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
