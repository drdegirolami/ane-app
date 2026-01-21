import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import type { FormTemplate } from '@/hooks/useFormTemplates';
import { useUpdateFormTemplate } from '@/hooks/useFormTemplates';
import type { FormSchema, FormField as FormFieldType, FormFieldOption, ScoreResult } from '@/types/forms';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
});

interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'checkbox';
  required: boolean;
  options: FormFieldOption[];
}

interface EditFormDialogProps {
  template: FormTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditFormDialog({ template, open, onOpenChange }: EditFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [isTest, setIsTest] = useState(false);
  const [scoreResults, setScoreResults] = useState<ScoreResult[]>([]);

  const updateMutation = useUpdateFormTemplate();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Load template data when dialog opens
  useEffect(() => {
    if (open && template) {
      form.setValue('title', template.title);
      form.setValue('description', template.description || '');

      const schema = template.schema_json as unknown as FormSchema;

      // Load fields from sections
      const loadedFields: FieldDefinition[] = schema.sections.flatMap((section) =>
        section.fields.map((field) => ({
          key: field.key,
          label: field.label,
          type: field.type,
          required: field.required,
          options: field.options || [],
        }))
      );
      setFields(loadedFields);

      // Check if it's a test with scoring
      if (schema.scoring?.enabled) {
        setIsTest(true);
        setScoreResults(schema.scoring.results || []);
      } else {
        setIsTest(false);
        setScoreResults([]);
      }
    }
  }, [open, template, form]);

  // Field management
  const addField = () => {
    const newKey = `field_${Date.now()}`;
    setFields([
      ...fields,
      {
        key: newKey,
        label: '',
        type: isTest ? 'radio' : 'text',
        required: true,
        options: isTest 
          ? [
              { value: 'opt_1', label: '', score: 0 },
              { value: 'opt_2', label: '', score: 1 },
            ] 
          : [],
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    // If changing type to radio/checkbox and no options, add one
    if ((updates.type === 'radio' || updates.type === 'checkbox') && newFields[index].options.length === 0) {
      newFields[index].options = [{ value: 'opt_1', label: '' }];
    }
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  // Option management
  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    const optNum = newFields[fieldIndex].options.length + 1;
    const nextScore = newFields[fieldIndex].options.length;
    newFields[fieldIndex].options.push({
      value: `opt_${optNum}`,
      label: '',
      ...(isTest ? { score: nextScore } : {}),
    });
    setFields(newFields);
  };

  const updateOption = (fieldIndex: number, optIndex: number, updates: Partial<FormFieldOption>) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optIndex] = {
      ...newFields[fieldIndex].options[optIndex],
      ...updates,
    };
    setFields(newFields);
  };

  const removeOption = (fieldIndex: number, optIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optIndex);
    setFields(newFields);
  };

  // Score results management (for tests)
  const addScoreResult = () => {
    setScoreResults([
      ...scoreResults,
      { min_score: 0, max_score: 10, result_title: '', result_text: '' },
    ]);
  };

  const updateScoreResult = (index: number, updates: Partial<ScoreResult>) => {
    const newResults = [...scoreResults];
    newResults[index] = { ...newResults[index], ...updates };
    setScoreResults(newResults);
  };

  const removeScoreResult = (index: number) => {
    setScoreResults(scoreResults.filter((_, i) => i !== index));
  };

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    // Validate fields
    if (fields.length === 0) {
      toast.error('Agrega al menos un campo');
      return;
    }

    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error('Todos los campos deben tener una etiqueta');
        return;
      }
      if ((field.type === 'radio' || field.type === 'checkbox') && field.options.length === 0) {
        toast.error(`El campo "${field.label}" necesita al menos una opción`);
        return;
      }
      for (const opt of field.options) {
        if (!opt.label.trim()) {
          toast.error(`Todas las opciones del campo "${field.label}" deben tener texto`);
          return;
        }
      }
    }

    // Validate score results for tests
    if (isTest && scoreResults.length === 0) {
      toast.error('Agrega al menos un rango de resultados');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build the schema
      const schemaJson: FormSchema = {
        version: 1,
        sections: [
          {
            title: values.title,
            fields: fields.map((f) => ({
              key: f.key,
              label: f.label,
              type: f.type,
              required: f.required,
              ...(f.options.length > 0 ? { options: f.options } : {}),
            })),
          },
        ],
        success: {
          title: '¡Gracias!',
          message: 'Tu respuesta ha sido guardada correctamente.',
          primaryCtaLabel: 'Volver',
          primaryCtaTo: '/evaluaciones',
        },
        ...(isTest
          ? {
              scoring: {
                enabled: true,
                results: scoreResults,
              },
            }
          : {}),
      };

      await updateMutation.mutateAsync({
        id: template.id,
        title: values.title,
        description: values.description || null,
        schemaJson,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Error updating form:', error);
      toast.error('Error al actualizar el formulario');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar {isTest ? 'Test' : 'Formulario'}</DialogTitle>
          <DialogDescription>
            Modifica los campos y configuración. El slug "{template.slug}" no puede ser cambiado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Basic info */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Slug (no editable)</Label>
                <Input value={template.slug} disabled className="bg-muted" />
              </div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Evaluación inicial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Breve descripción del formulario..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fields section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {isTest ? 'Preguntas' : 'Campos'}
              </h3>

              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay {isTest ? 'preguntas' : 'campos'} definidos
                </p>
              )}

              {fields.map((field, fieldIndex) => (
                <Card key={field.key}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">
                          {isTest ? `Pregunta ${fieldIndex + 1}` : `Campo ${fieldIndex + 1}`}
                        </CardTitle>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeField(fieldIndex)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Key (único)</Label>
                        <Input
                          value={field.key}
                          onChange={(e) => updateField(fieldIndex, { key: e.target.value })}
                          placeholder="pregunta_1"
                        />
                      </div>
                      {!isTest && (
                        <div className="space-y-2">
                          <Label>Tipo de campo</Label>
                          <Select
                            value={field.type}
                            onValueChange={(value) =>
                              updateField(fieldIndex, {
                                type: value as FieldDefinition['type'],
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Texto corto</SelectItem>
                              <SelectItem value="textarea">Texto largo</SelectItem>
                              <SelectItem value="number">Número</SelectItem>
                              <SelectItem value="radio">Opción única (radio)</SelectItem>
                              <SelectItem value="checkbox">Múltiple (checkbox)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Etiqueta / Pregunta</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateField(fieldIndex, { label: e.target.value })}
                        placeholder={isTest ? 'Ej: ¿Cómo te sientes hoy?' : 'Ej: Nombre completo'}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={field.required}
                        onCheckedChange={(checked) => updateField(fieldIndex, { required: checked })}
                      />
                      <Label>Campo requerido</Label>
                    </div>

                    {/* Options for radio/checkbox or tests */}
                    {(field.type === 'radio' || field.type === 'checkbox' || isTest) && (
                      <div className="space-y-3 pl-4 border-l-2 border-muted">
                        <Label className="text-sm">Opciones</Label>
                        {field.options.map((opt, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <Input
                              className="flex-1"
                              value={opt.label}
                              onChange={(e) =>
                                updateOption(fieldIndex, optIndex, { label: e.target.value })
                              }
                              placeholder={`Opción ${optIndex + 1}`}
                            />
                            {isTest && (
                              <Input
                                type="number"
                                className="w-20"
                                value={opt.score ?? 0}
                                onChange={(e) =>
                                  updateOption(fieldIndex, optIndex, {
                                    score: parseInt(e.target.value) || 0,
                                  })
                                }
                                placeholder="Pts"
                              />
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeOption(fieldIndex, optIndex)}
                              disabled={field.options.length <= 1}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        {/* Add option button - below last option */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-full"
                          onClick={() => addOption(fieldIndex)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar opción
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {/* Add field/question button - below last field */}
              <Button type="button" variant="outline" className="w-full" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar {isTest ? 'pregunta' : 'campo'}
              </Button>
            </div>

            {/* Score results (only for tests) */}
            {isTest && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Rangos de Resultados</h3>

                {scoreResults.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Define rangos de puntaje para mostrar diferentes resultados
                  </p>
                )}

                {scoreResults.map((result, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">Rango {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeScoreResult(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Puntaje mínimo</Label>
                          <Input
                            type="number"
                            value={result.min_score}
                            onChange={(e) =>
                              updateScoreResult(index, { min_score: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Puntaje máximo</Label>
                          <Input
                            type="number"
                            value={result.max_score}
                            onChange={(e) =>
                              updateScoreResult(index, { max_score: parseInt(e.target.value) || 0 })
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Título del resultado</Label>
                        <Input
                          value={result.result_title}
                          onChange={(e) => updateScoreResult(index, { result_title: e.target.value })}
                          placeholder="Ej: Ansiedad leve"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Mensaje del resultado</Label>
                        <Textarea
                          value={result.result_text}
                          onChange={(e) => updateScoreResult(index, { result_text: e.target.value })}
                          placeholder="Mensaje explicativo para el paciente..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button type="button" variant="outline" className="w-full" onClick={addScoreResult}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar rango
                </Button>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
