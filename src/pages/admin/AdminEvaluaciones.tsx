import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Eye, Check, Clock, Users, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { useFormTemplates } from '@/hooks/useFormTemplates';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import CreateFormDialog from '@/components/forms/CreateFormDialog';
import CreateTestDialog from '@/components/forms/CreateTestDialog';

// Component for each template's expandable section
function TemplateSection({ template }: { template: { id: string; slug: string; title: string; description: string | null } }) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: patientsWithResponses, isLoading } = useAdminPatientsWithResponses(
    isOpen ? template.id : ''
  );

  const completedCount = patientsWithResponses?.filter((p) => p.response !== null).length ?? 0;
  const totalCount = patientsWithResponses?.length ?? 0;

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{template.title}</CardTitle>
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                {template.description && (
                  <CardDescription>{template.description}</CardDescription>
                )}
              </div>
              {isOpen && !isLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{completedCount}/{totalCount} completadas</span>
                </div>
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : patientsWithResponses && patientsWithResponses.length > 0 ? (
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
                            <Link to={`/admin/evaluaciones/${template.slug}/${profile.user_id}`}>
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

export default function AdminEvaluaciones() {
  const { data: templates, isLoading } = useFormTemplates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Evaluaciones</h1>
          <p className="text-muted-foreground">
            Gestiona los formularios y visualiza las respuestas de los pacientes
          </p>
        </div>
        <div className="flex gap-2">
          <CreateFormDialog />
          <CreateTestDialog />
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Templates list */}
      {!isLoading && templates && templates.length > 0 && (
        <div className="space-y-4">
          {templates.map((template) => (
            <TemplateSection key={template.id} template={template} />
          ))}
        </div>
      )}

      {/* No templates */}
      {!isLoading && (!templates || templates.length === 0) && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay formularios creados todavía
            </p>
            <CreateFormDialog />
          </CardContent>
        </Card>
      )}
    </div>
  );
}