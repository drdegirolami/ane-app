import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Loader2, Trash2, ClipboardCheck } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { FormSchema, ScoreResult } from '@/types/forms';

const formSchema = z.object({
  slug: z.string().min(1, 'El slug es requerido').regex(/^[a-z0-9_]+$/, 'Solo minúsculas, números y guiones bajos'),
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface QuestionOption {
  value: string;
  label: string;
  score: number;
}

interface QuestionDefinition {
  key: string;
  label: string;
  required: boolean;
  options: QuestionOption[];
}

export default function CreateTestDialog() {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<QuestionDefinition[]>([]);
  const [scoreResults, setScoreResults] = useState<ScoreResult[]>([
    { min_score: 0, max_score: 4, result_title: '', result_text: '' },
  ]);
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      slug: '',
      title: '',
      description: '',
    },
  });

  // Questions management
  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        key: `pregunta_${questions.length + 1}`,
        label: '',
        required: true,
        options: [
          { value: 'opcion_1', label: '', score: 0 },
          { value: 'opcion_2', label: '', score: 1 },
        ],
      },
    ]);
  };

  const updateQuestion = (index: number, updates: Partial<QuestionDefinition>) => {
    const newQuestions = [...questions];
    newQuestions[index] = { ...newQuestions[index], ...updates };
    setQuestions(newQuestions);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const newQuestions = [...questions];
    const nextScore = newQuestions[questionIndex].options.length;
    newQuestions[questionIndex].options.push({
      value: `opcion_${nextScore + 1}`,
      label: '',
      score: nextScore,
    });
    setQuestions(newQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, updates: Partial<QuestionOption>) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options[optionIndex] = {
      ...newQuestions[questionIndex].options[optionIndex],
      ...updates,
    };
    setQuestions(newQuestions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const newQuestions = [...questions];
    newQuestions[questionIndex].options = newQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(newQuestions);
  };

  // Score results management
  const addScoreResult = () => {
    const lastResult = scoreResults[scoreResults.length - 1];
    const newMinScore = lastResult ? lastResult.max_score + 1 : 0;
    setScoreResults([
      ...scoreResults,
      { min_score: newMinScore, max_score: newMinScore + 4, result_title: '', result_text: '' },
    ]);
  };

  const updateScoreResult = (index: number, updates: Partial<ScoreResult>) => {
    const newResults = [...scoreResults];
    newResults[index] = { ...newResults[index], ...updates };
    setScoreResults(newResults);
  };

  const removeScoreResult = (index: number) => {
    if (scoreResults.length > 1) {
      setScoreResults(scoreResults.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (values: FormValues) => {
    if (questions.length === 0) {
      toast.error('Agregá al menos una pregunta');
      return;
    }

    // Validate questions
    for (const question of questions) {
      if (!question.label.trim()) {
        toast.error('Todas las preguntas deben tener una etiqueta');
        return;
      }
      if (question.options.length < 2) {
        toast.error(`La pregunta "${question.label}" necesita al menos 2 opciones`);
        return;
      }
      for (const option of question.options) {
        if (!option.label.trim()) {
          toast.error('Todas las opciones deben tener una etiqueta');
          return;
        }
      }
    }

    // Validate score results
    for (const result of scoreResults) {
      if (!result.result_title.trim() || !result.result_text.trim()) {
        toast.error('Todos los rangos de resultado deben tener título y texto');
        return;
      }
      if (result.min_score > result.max_score) {
        toast.error('El puntaje mínimo no puede ser mayor al máximo');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      // Build schema with scoring
      const schemaJson: FormSchema = {
        version: 1,
        sections: [
          {
            title: 'Preguntas',
            fields: questions.map((q) => ({
              key: q.key,
              label: q.label,
              type: 'radio' as const,
              required: q.required,
              options: q.options.map((o) => ({
                value: o.value,
                label: o.label,
                score: o.score,
              })),
            })),
          },
        ],
        scoring: {
          enabled: true,
          results: scoreResults,
        },
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

      toast.success('Test creado correctamente');
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      setOpen(false);
      form.reset();
      setQuestions([]);
      setScoreResults([{ min_score: 0, max_score: 4, result_title: '', result_text: '' }]);
    } catch (error: any) {
      console.error('Error creating test:', error);
      if (error.code === '23505') {
        toast.error('Ya existe un test con ese slug');
      } else {
        toast.error('Error al crear el test');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <ClipboardCheck className="h-4 w-4" />
          Crear test con puntaje
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear nuevo test con puntaje</DialogTitle>
          <DialogDescription>
            Creá un test con preguntas ponderadas. El paciente recibirá un resultado basado en su puntaje.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Basic info */}
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="slug">Slug (identificador único)</Label>
              <Input
                id="slug"
                placeholder="mi_test_ansiedad"
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
                placeholder="Test de Ansiedad"
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
                placeholder="Breve descripción del test..."
                {...form.register('description')}
              />
            </div>
          </div>

          <Separator />

          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Preguntas</Label>
                <p className="text-sm text-muted-foreground">Cada opción tiene un puntaje asociado</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar pregunta
              </Button>
            </div>

            {questions.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4 bg-muted/50 rounded-lg">
                No hay preguntas. Agregá al menos una.
              </p>
            )}

            {questions.map((question, qIndex) => (
              <Card key={qIndex}>
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">Pregunta {qIndex + 1}</CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(qIndex)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="py-3 px-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Key (único)</Label>
                      <Input
                        value={question.key}
                        onChange={(e) => updateQuestion(qIndex, { key: e.target.value })}
                        placeholder="pregunta_1"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Checkbox
                        id={`required-${qIndex}`}
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(qIndex, { required: !!checked })}
                      />
                      <Label htmlFor={`required-${qIndex}`} className="text-xs">Requerida</Label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Pregunta</Label>
                    <Input
                      value={question.label}
                      onChange={(e) => updateQuestion(qIndex, { label: e.target.value })}
                      placeholder="¿Con qué frecuencia te sentís ansioso/a?"
                    />
                  </div>

                  {/* Options with scores */}
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Opciones de respuesta</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => addOption(qIndex)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {question.options.map((option, oIndex) => (
                        <div key={oIndex} className="flex gap-2 items-center">
                          <Input
                            value={option.label}
                            onChange={(e) => updateOption(qIndex, oIndex, { label: e.target.value })}
                            placeholder="Etiqueta de la opción"
                            className="h-8 text-xs flex-1"
                          />
                          <div className="flex items-center gap-1">
                            <Input
                              type="number"
                              value={option.score}
                              onChange={(e) => updateOption(qIndex, oIndex, { score: parseInt(e.target.value) || 0 })}
                              className="h-8 text-xs w-16 text-center"
                            />
                            <span className="text-xs text-muted-foreground">pts</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => removeOption(qIndex, oIndex)}
                            disabled={question.options.length <= 2}
                          >
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />

          {/* Score Results */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Rangos de resultado</Label>
                <p className="text-sm text-muted-foreground">Define qué mensaje ve el paciente según su puntaje</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addScoreResult}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar rango
              </Button>
            </div>

            {scoreResults.map((result, index) => (
              <Card key={index} className="bg-muted/30">
                <CardContent className="py-4 px-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Rango {index + 1}:</span>
                      <Input
                        type="number"
                        value={result.min_score}
                        onChange={(e) => updateScoreResult(index, { min_score: parseInt(e.target.value) || 0 })}
                        className="h-8 w-16 text-center text-sm"
                      />
                      <span className="text-sm text-muted-foreground">a</span>
                      <Input
                        type="number"
                        value={result.max_score}
                        onChange={(e) => updateScoreResult(index, { max_score: parseInt(e.target.value) || 0 })}
                        className="h-8 w-16 text-center text-sm"
                      />
                      <span className="text-sm text-muted-foreground">puntos</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeScoreResult(index)}
                      disabled={scoreResults.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Título del resultado</Label>
                    <Input
                      value={result.result_title}
                      onChange={(e) => updateScoreResult(index, { result_title: e.target.value })}
                      placeholder="Ej: Ansiedad leve"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <Label className="text-xs">Texto de devolución</Label>
                    <Textarea
                      value={result.result_text}
                      onChange={(e) => updateScoreResult(index, { result_text: e.target.value })}
                      placeholder="Texto que verá el paciente al obtener este resultado..."
                      className="min-h-[80px]"
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear test
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
