import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Eye, Check, Clock, Users, ChevronDown, ChevronUp, Pencil, Trash2, Send, ClipboardCheck, FileText } from 'lucide-react';
import { useAllFormTemplates, usePublishFormTemplate, type FormTemplate } from '@/hooks/useFormTemplates';
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
import EditFormDialog from '@/components/forms/EditFormDialog';
import DeleteFormDialog from '@/components/forms/DeleteFormDialog';
import { FormSchema } from '@/types/forms';

// Helper to check if a template is a test (has scoring enabled)
function isTestTemplate(template: FormTemplate): boolean {
  const schema = template.schema_json as unknown as FormSchema;
  return schema?.scoring?.enabled === true;
}

// Component for each template's expandable section
function TemplateSection({ template }: { template: FormTemplate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const publishMutation = usePublishFormTemplate();
  const { data: patientsWithResponses, isLoading } = useAdminPatientsWithResponses(
    isOpen ? template.id : ''
  );

  const completedCount = patientsWithResponses?.filter((p) => p.response !== null).length ?? 0;
  const totalCount = patientsWithResponses?.length ?? 0;

  return (
    <>
      <Card>
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-4">
            <div className="flex items-start justify-between gap-4">
              <CollapsibleTrigger asChild>
                <div className="space-y-1 flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-medium">{template.title}</CardTitle>
                    {!template.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Borrador
                      </Badge>
                    )}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  {template.description && (
                    <CardDescription className="text-sm">{template.description}</CardDescription>
                  )}
                </div>
              </CollapsibleTrigger>
              <div className="flex items-center gap-1">
                {isOpen && !isLoading && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mr-2">
                    <Users className="h-4 w-4" />
                    <span>{completedCount}/{totalCount}</span>
                  </div>
                )}
                {!template.is_active && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      publishMutation.mutate(template.id);
                    }}
                    disabled={publishMutation.isPending}
                    title="Publicar"
                    className="gap-1"
                  >
                    <Send className="h-4 w-4" />
                    Publicar
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditOpen(true);
                  }}
                  title="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteOpen(true);
                  }}
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </CardHeader>
          
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
                              <Badge variant="outline" className="text-primary border-primary/30">
                                <Check className="h-3 w-3 mr-1" />
                                Completado
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
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

      <EditFormDialog template={template} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteFormDialog template={template} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

// Section component for grouping templates
function TemplateListSection({ 
  title, 
  description, 
  icon: Icon, 
  templates, 
  emptyMessage,
  createButton 
}: { 
  title: string;
  description: string;
  icon: React.ElementType;
  templates: FormTemplate[];
  emptyMessage: string;
  createButton: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        {createButton}
      </div>

      {templates.length > 0 ? (
        <div className="space-y-3">
          {templates.map((template) => (
            <TemplateSection key={template.id} template={template} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{emptyMessage}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AdminEvaluaciones() {
  const { data: templates, isLoading } = useAllFormTemplates();

  // Separate tests from regular forms
  const tests = templates?.filter(isTestTemplate) ?? [];
  const forms = templates?.filter((t) => !isTestTemplate(t)) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Evaluaciones</h1>
        <p className="text-muted-foreground">
          Gestiona los tests y formularios, y visualiza las respuestas de los pacientes
        </p>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Content */}
      {!isLoading && (
        <div className="space-y-10">
          {/* Tests Section */}
          <TemplateListSection
            title="Tests con puntaje"
            description="Evaluaciones clínicas con resultados automáticos basados en puntaje"
            icon={ClipboardCheck}
            templates={tests}
            emptyMessage="No hay tests creados todavía"
            createButton={<CreateTestDialog />}
          />

          {/* Forms Section */}
          <TemplateListSection
            title="Formularios"
            description="Cuestionarios y formularios de recopilación de datos"
            icon={FileText}
            templates={forms}
            emptyMessage="No hay formularios creados todavía"
            createButton={<CreateFormDialog />}
          />
        </div>
      )}
    </div>
  );
}
