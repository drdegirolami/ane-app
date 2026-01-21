import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Check, Loader2, Lock } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { useMyFormResponses } from '@/hooks/useFormResponse';
import { useMyNextStep } from '@/hooks/useMyNextStep';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import CreateFormDialog from '@/components/forms/CreateFormDialog';

export default function Evaluaciones() {
  const { isAdmin } = useAuth();
  const { data: templates, isLoading, error } = useFormTemplates();
  const { data: responses } = useMyFormResponses();
  const { data: nextStep } = useMyNextStep();

  const completedTemplateIds = new Set(responses?.map((r) => r.template_id) || []);

  // Filter templates based on role
  // Admin: sees all active templates
  // Patient: sees templates that match their next_step_slug or have been completed
  const visibleTemplates = templates?.filter((template) => {
    if (isAdmin) return true;
    
    // Patient logic: show if completed or if next_step matches
    const isCompleted = completedTemplateIds.has(template.id);
    if (isCompleted) return true;
    
    // Check if next_step_slug matches template slug
    if (nextStep?.next_step_slug === template.slug) return true;
    
    // Also check if next_step_slug starts with 'form_' pattern and matches
    if (nextStep?.next_step_slug?.startsWith('form_')) {
      const formSlug = nextStep.next_step_slug.replace('form_', '');
      if (formSlug === template.slug) return true;
    }
    
    return false;
  });

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Evaluaciones</h1>
          </div>
          
          {isAdmin && <CreateFormDialog />}
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

        {!isLoading && !error && visibleTemplates?.length === 0 && (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isAdmin 
                ? 'No hay formularios creados. Creá uno nuevo.' 
                : 'Todavía no hay evaluaciones disponibles para vos'}
            </p>
          </div>
        )}

        {!isLoading && !error && visibleTemplates && visibleTemplates.length > 0 && (
          <div className="grid gap-4">
            {visibleTemplates.map((template) => {
              const isCompleted = completedTemplateIds.has(template.id);
              const isAvailable = isAdmin || isCompleted || nextStep?.next_step_slug === template.slug;

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
                    {isAvailable ? (
                      <Link to={`/evaluaciones/${template.slug}`} className="ml-auto">
                        <Button variant="default" size="sm" className="gap-2">
                          {isCompleted ? 'Ver' : 'Completar'}
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <div className="ml-auto flex items-center gap-2 text-muted-foreground text-sm">
                        <Lock className="h-4 w-4" />
                        <span>Disponible pronto</span>
                      </div>
                    )}
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
