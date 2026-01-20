import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, FileQuestion, User } from 'lucide-react';
import { useFormTemplateBySlug, FormSchema } from '@/hooks/useFormTemplates';
import { useAdminPatientResponse, useAdminPatientProfile } from '@/hooks/useAdminEvaluaciones';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import FormReadOnly from '@/components/forms/FormReadOnly';

export default function AdminEvaluacionPaciente() {
  const { slug, patientId } = useParams<{ slug: string; patientId: string }>();
  
  const { data: template, isLoading: loadingTemplate } = useFormTemplateBySlug(slug ?? '');
  const { data: profile, isLoading: loadingProfile } = useAdminPatientProfile(patientId ?? '');
  const { data: response, isLoading: loadingResponse } = useAdminPatientResponse(
    template?.id ?? '',
    patientId ?? ''
  );

  const schema = template?.schema_json as unknown as FormSchema | null;
  const answers = response?.answers_json as Record<string, unknown> | null;

  const isLoading = loadingTemplate || loadingProfile || (template && loadingResponse);

  return (
    <div className="p-6 space-y-6">
      {/* Back link */}
      <Link 
        to="/admin/evaluaciones" 
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

      {/* Not found state */}
      {!isLoading && (!template || !profile) && (
        <div className="text-center py-12">
          <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Evaluación o paciente no encontrado</p>
          <Link to="/admin/evaluaciones">
            <Button variant="outline" className="mt-4">
              Volver a Evaluaciones
            </Button>
          </Link>
        </div>
      )}

      {/* Content */}
      {!isLoading && template && profile && schema && (
        <>
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-foreground">{template.title}</h1>
            
            {/* Patient info */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {profile.full_name || 'Sin nombre'}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {profile.email}
                    </p>
                  </div>
                  <Badge 
                    variant="secondary"
                    className={profile.status === 'active' 
                      ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                    }
                  >
                    {profile.status === 'active' ? 'Activo' : profile.status || 'Sin estado'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* No response */}
          {!response && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Este paciente aún no completó esta evaluación.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Response content */}
          {response && answers && (
            <>
              {/* Submission info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                <span>Enviado el</span>
                <Badge variant="outline">
                  {format(new Date(response.submitted_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                </Badge>
                {response.updated_at !== response.submitted_at && (
                  <>
                    <span>• Actualizado</span>
                    <Badge variant="outline">
                      {format(new Date(response.updated_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                    </Badge>
                  </>
                )}
              </div>

              {/* Reusable read-only form */}
              <FormReadOnly schema={schema} answers={answers} />
            </>
          )}
        </>
      )}
    </div>
  );
}
