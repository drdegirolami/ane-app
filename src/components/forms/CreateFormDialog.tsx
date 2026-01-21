import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { FormField as FormFieldType, FormSchema } from '@/types/forms';

const formSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'radio' | 'checkbox';
  required: boolean;
  options: { value: string; label: string }[];
}

export default function CreateFormDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: '',
      title: '',
      description: '',
    },
  });

  const addField = () => {
    setFields([
      ...fields,
      {
        key: `campo_${fields.length + 1}`,
        label: '',
        type: 'text',
        required: false,
        options: [],
      },
    ]);
  };

  const updateField = (index: number, updates: Partial<FieldDefinition>) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const addOption = (fieldIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].options.push({
      value: `opcion_${newFields[fieldIndex].options.length + 1}`,
      label: '',
    });
    setFields(newFields);
  };

  const updateOption = (fieldIndex: number, optionIndex: number, updates: { value?: string; label?: string }) => {
    const newFields = [...fields];
    newFields[fieldIndex].options[optionIndex] = {
      ...newFields[fieldIndex].options[optionIndex],
      ...updates,
    };
    setFields(newFields);
  };

  const removeOption = (fieldIndex: number, optionIndex: number) => {
    const newFields = [...fields];
    newFields[fieldIndex].options = newFields[fieldIndex].options.filter((_, i) => i !== optionIndex);
    setFields(newFields);
  };

  const handleSubmit = async (values: FormValues) => {
    if (fields.length === 0) {
      toast.error('Agregá al menos un campo');
      return;
    }

    // Validate fields
    for (const field of fields) {
      if (!field.label.trim()) {
        toast.error('Todos los campos deben tener una etiqueta');
        return;
      }
      if ((field.type === 'radio' || field.type === 'checkbox') && field.options.length < 2) {
        toast.error(`El campo "${field.label}" necesita al menos 2 opciones`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build schema
      const schemaJson: FormSchema = {
        version: 1,
        sections: [
          {
            title: 'Preguntas',
            fields: fields.map((f): FormFieldType => ({
              key: f.key,
              label: f.label,
              type: f.type,
              required: f.required,
              ...(f.options.length > 0 && { options: f.options }),
            })),
          },
        ],
      };

      const { error } = await supabase.from('form_templates').insert([{
        slug: values.slug,
        title: values.title,
        description: values.description || null,
        schema_json: JSON.parse(JSON.stringify(schemaJson)),
        is_active: true,
        order_index: 0,
      }]);

      if (error) throw error;

      toast.success('Formulario creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      setOpen(false);
      form.reset();
      setFields([]);
    } catch (error: any) {
      console.error('Error creating form:', error);
      if (error.code === '23505') {
        toast.error('Ya existe un formulario con ese slug');
      } else {
        toast.error('Error al crear el formulario');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Crear formulario
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo formulario</DialogTitle>
          <DialogDescription>
            Define el formulario con sus campos. Los pacientes podrán completarlo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <Input
                id="slug"
                placeholder="mi_formulario"
                {...form.register('slug')}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Mi Formulario"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                placeholder="Breve descripción del formulario..."
                {...form.register('description')}
              />
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Campos del formulario</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar campo
              </Button>
            </div>

            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay campos. Agregá al menos uno.
              </p>
            )}

            {fields.map((field, index) => (
              <Card key={index}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Campo {index + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeField(index)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Key (único)</Label>
                      <Input
                        value={field.key}
                        onChange={(e) => updateField(index, { key: e.target.value })}
                        placeholder="campo_1"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Tipo</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value: FieldDefinition['type']) => updateField(index, { type: value })}
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
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Etiqueta (pregunta)</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="¿Cuál es tu pregunta?"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`required-${index}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateField(index, { required: !!checked })}
                    />
                    <Label htmlFor={`required-${index}`} className="text-xs">Requerido</Label>
                  </div>

                  {/* Options for radio/checkbox */}
                  {(field.type === 'radio' || field.type === 'checkbox') && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Opciones</Label>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => addOption(index)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar
                        </Button>
                      </div>
                      {field.options.map((option, optIndex) => (
                        <div key={optIndex} className="flex gap-2 items-center">
                          <Input
                            value={option.value}
                            onChange={(e) => updateOption(index, optIndex, { value: e.target.value })}
                            placeholder="valor"
                            className="h-8 text-xs flex-1"
                          />
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(index, optIndex, { label: e.target.value })}
                            placeholder="Etiqueta visible"
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeOption(index, optIndex)}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear formulario
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
