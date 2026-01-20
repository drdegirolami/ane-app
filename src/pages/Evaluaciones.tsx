import { Link } from 'react-router-dom';
import { ClipboardList, ArrowRight, Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useFormTemplates } from '@/hooks/useFormTemplates';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function Evaluaciones() {
  const { data: templates, isLoading, error } = useFormTemplates();

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
            {templates.map((template) => (
              <Card key={template.id} wellness className="hover:scale-[1.01] transition-transform">
                <CardHeader>
                  <CardTitle>{template.title}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </CardHeader>
                <CardFooter>
                  <Link to={`/evaluaciones/${template.slug}`} className="ml-auto">
                    <Button variant="default" size="sm" className="gap-2">
                      Ver
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
