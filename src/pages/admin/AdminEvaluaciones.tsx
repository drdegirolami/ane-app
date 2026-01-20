import { Link } from 'react-router-dom';
import { Loader2, Eye, Check, Clock, Users } from 'lucide-react';
import { useFormTemplateBySlug } from '@/hooks/useFormTemplates';
import { useAdminPatientsWithResponses } from '@/hooks/useAdminEvaluaciones';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const BASELINE_SLUG = 'baseline_0_2';

export default function AdminEvaluaciones() {
  const { data: template, isLoading: loadingTemplate } = useFormTemplateBySlug(BASELINE_SLUG);
  
  // Only fetch patients when we have a valid template.id
  const templateId = template?.id;
  const { data: patientsWithResponses, isLoading: loadingPatients } = useAdminPatientsWithResponses(
    templateId ?? ''
  );

  // Show loading while fetching template, or while fetching patients (only if template exists)
  const isLoading = loadingTemplate || (!!templateId && loadingPatients);

  const completedCount = patientsWithResponses?.filter((p) => p.response !== null).length ?? 0;
  const totalCount = patientsWithResponses?.length ?? 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Evaluaciones</h1>
        <p className="text-muted-foreground">
          Visualiza las respuestas de los pacientes a las evaluaciones
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Template info card */}
      {!isLoading && template && (
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>{template.title}</CardTitle>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{completedCount}/{totalCount} completadas</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Patients table */}
            {patientsWithResponses && patientsWithResponses.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Paciente</TableHead>
                      <TableHead className="hidden sm:table-cell">Email</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="hidden md:table-cell">Fecha</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsWithResponses.map(({ profile, response }) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          {profile.full_name || 'Sin nombre'}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {profile.email}
                        </TableCell>
                        <TableCell>
                          {response ? (
                            <Badge 
                              variant="secondary"
                              className="bg-green-500/10 text-green-600 border-green-500/20"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Completado
                            </Badge>
                          ) : (
                            <Badge 
                              variant="secondary"
                              className="bg-amber-500/10 text-amber-600 border-amber-500/20"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {response 
                            ? format(new Date(response.submitted_at), "d MMM yyyy", { locale: es })
                            : '—'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          {response ? (
                            <Link to={`/admin/evaluaciones/${BASELINE_SLUG}/${profile.user_id}`}>
                              <Button variant="outline" size="sm" className="gap-1">
                                <Eye className="h-4 w-4" />
                                <span className="hidden sm:inline">Ver</span>
                              </Button>
                            </Link>
                          ) : (
                            <Button variant="ghost" size="sm" disabled>
                              <Eye className="h-4 w-4 opacity-50" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No hay pacientes registrados
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No template found */}
      {!isLoading && !template && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              No se encontró el template de evaluación baseline.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
