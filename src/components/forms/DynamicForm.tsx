import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, HelpCircle } from 'lucide-react';
import { FormSchema, FormField as FormFieldType } from '@/types/forms';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { calculateScore, hasScoringEnabled } from '@/lib/scoring';

interface DynamicFormProps {
  templateId: string;
  schema: FormSchema;
  initialValues?: Record<string, unknown>;
  onSubmit: (values: Record<string, unknown>, score?: number) => void;
  isSubmitting?: boolean;
}

// Build Zod schema dynamically from FormSchema
// Tipos guardados: text/textarea -> string, number -> number, radio -> string, checkbox -> string[]
function buildZodSchema(schema: FormSchema) {
  const shape: Record<string, z.ZodTypeAny> = {};

  schema.sections.forEach((section) => {
    section.fields.forEach((field) => {
      let fieldSchema: z.ZodTypeAny;

      switch (field.type) {
        case 'number':
          fieldSchema = z
            .union([z.string(), z.number()])
            .transform((val) => {
              if (val === '' || val === undefined || val === null) return undefined;
              const num = typeof val === 'number' ? val : parseFloat(val);
              return isNaN(num) ? undefined : num;
            });
          if (field.required) {
            fieldSchema = fieldSchema.refine((val) => val !== undefined, {
              message: 'Este campo es obligatorio',
            });
          }
          break;
        case 'radio':
          fieldSchema = field.required
            ? z.string().min(1, 'Seleccioná una opción')
            : z.string().optional();
          break;
        case 'checkbox':
          fieldSchema = field.required
            ? z.array(z.string()).min(1, 'Seleccioná al menos una opción')
            : z.array(z.string()).default([]);
          break;
        case 'text':
        case 'textarea':
        default:
          fieldSchema = field.required
            ? z.string().min(1, 'Este campo es obligatorio')
            : z.string().optional();
          break;
      }

      shape[field.key] = fieldSchema;
    });
  });

  return z.object(shape);
}

// Get all fields flattened
function getAllFields(schema: FormSchema): FormFieldType[] {
  return schema.sections.flatMap((section) => section.fields);
}

export default function DynamicForm({
  templateId,
  schema,
  initialValues = {},
  onSubmit,
  isSubmitting = false,
}: DynamicFormProps) {
  const zodSchema = buildZodSchema(schema);
  
  // Build default values with correct types
  const allFields = getAllFields(schema);
  const defaultValues: Record<string, unknown> = {};
  allFields.forEach((field) => {
    if (initialValues[field.key] !== undefined) {
      defaultValues[field.key] = initialValues[field.key];
    } else {
      // Default values by type
      switch (field.type) {
        case 'checkbox':
          defaultValues[field.key] = [];
          break;
        case 'number':
          defaultValues[field.key] = '';
          break;
        default:
          defaultValues[field.key] = '';
      }
    }
  });

  const form = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues,
  });

  const handleSubmit = (values: Record<string, unknown>) => {
    // Clean up empty strings for optional fields
    const cleanedValues: Record<string, unknown> = {};
    Object.entries(values).forEach(([key, value]) => {
      if (value !== '' && value !== undefined) {
        cleanedValues[key] = value;
      }
    });

    // Calcular puntaje si el schema tiene scoring habilitado
    let score: number | undefined;
    if (hasScoringEnabled(schema)) {
      score = calculateScore(schema, cleanedValues);
    }

    onSubmit(cleanedValues, score);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {schema.sections.map((section, sectionIndex) => (
          <Card key={sectionIndex} wellness>
            <CardHeader>
              <CardTitle className="text-lg">{section.title}</CardTitle>
              {section.description && (
                <CardDescription>{section.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {section.fields.map((field) => (
                <FormField
                  key={field.key}
                  control={form.control}
                  name={field.key}
                  render={({ field: formField }) => (
                    <FormItem>
                      <Label className="flex items-start gap-1">
                        {field.label}
                        {field.required && (
                          <span className="text-destructive">*</span>
                        )}
                      </Label>
                      {field.helpText && (
                        <div className="flex items-start gap-1.5 text-xs text-muted-foreground mb-2">
                          <HelpCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span>{field.helpText}</span>
                        </div>
                      )}
                      <FormControl>
                        {field.type === 'textarea' ? (
                          <Textarea
                            {...formField}
                            value={formField.value as string ?? ''}
                            placeholder="Escribí tu respuesta..."
                            className="min-h-[100px]"
                          />
                        ) : field.type === 'number' ? (
                          <Input
                            {...formField}
                            type="number"
                            value={formField.value as string ?? ''}
                            placeholder="0"
                            inputMode="decimal"
                          />
                        ) : field.type === 'radio' && field.options ? (
                          <RadioGroup
                            value={formField.value as string ?? ''}
                            onValueChange={formField.onChange}
                            className="space-y-2"
                          >
                            {field.options.map((option) => (
                              <div key={option.value} className="flex items-center space-x-3">
                                <RadioGroupItem 
                                  value={option.value} 
                                  id={`${field.key}-${option.value}`} 
                                />
                                <Label 
                                  htmlFor={`${field.key}-${option.value}`} 
                                  className="font-normal cursor-pointer"
                                >
                                  {option.label}
                                </Label>
                              </div>
                            ))}
                          </RadioGroup>
                        ) : field.type === 'checkbox' && field.options ? (
                          <div className="space-y-2">
                            {field.options.map((option) => {
                              const values = (formField.value as string[]) || [];
                              const isChecked = values.includes(option.value);
                              
                              return (
                                <div key={option.value} className="flex items-center space-x-3">
                                  <Checkbox
                                    id={`${field.key}-${option.value}`}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const newValues = checked
                                        ? [...values, option.value]
                                        : values.filter((v) => v !== option.value);
                                      formField.onChange(newValues);
                                    }}
                                  />
                                  <Label 
                                    htmlFor={`${field.key}-${option.value}`} 
                                    className="font-normal cursor-pointer"
                                  >
                                    {option.label}
                                  </Label>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <Input
                            {...formField}
                            value={formField.value as string ?? ''}
                            placeholder="Escribí tu respuesta..."
                          />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        ))}

        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Guardando...
              </>
            ) : (
              'Guardar'
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
