import { useState } from 'react';
import { Check, Send } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const weekOptions = ['Muy difícil', 'Difícil', 'Regular', 'Bien', 'Muy bien'];

const questions = [
  {
    id: 'general',
    question: '¿Cómo fue tu semana en general?',
    type: 'options',
    options: weekOptions,
  },
  {
    id: 'dificil',
    question: '¿Qué fue lo más difícil?',
    type: 'text',
    placeholder: 'Escribí brevemente...',
  },
  {
    id: 'ansiedad',
    question: 'Nivel de ansiedad (0-10)',
    type: 'slider',
  },
  {
    id: 'salidas',
    question: '¿Hubo salidas del plan?',
    type: 'options',
    options: ['No', 'Pocas veces', 'Varias veces', 'Muchas veces'],
  },
  {
    id: 'ajustar',
    question: '¿Qué sentís que necesitás ajustar?',
    type: 'text',
    placeholder: 'Contanos qué te gustaría mejorar...',
  },
];

export default function Checkin() {
  const { toast } = useToast();
  const [answers, setAnswers] = useState<Record<string, string | number>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleOptionSelect = (questionId: string, option: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: option }));
  };

  const handleTextChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleSliderChange = (questionId: string, value: number[]) => {
    setAnswers(prev => ({ ...prev, [questionId]: value[0] }));
  };

  const handleSubmit = () => {
    setSubmitted(true);
    toast({
      title: "Check-in enviado",
      description: "Gracias por compartir cómo fue tu semana.",
    });
  };

  const isComplete = questions.every(q => answers[q.id] !== undefined && answers[q.id] !== '');

  if (submitted) {
    return (
      <AppLayout>
        <div className="max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <Check className="h-10 w-10 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              ¡Check-in completado!
            </h1>
            <p className="text-muted-foreground mt-2">
              Gracias por tomarte el tiempo de reflexionar sobre tu semana.
              Esto nos ayuda a acompañarte mejor.
            </p>
          </div>
          <Button variant="soft" onClick={() => setSubmitted(false)}>
            Modificar respuestas
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Check-in Semanal
          </h1>
          <p className="text-muted-foreground mt-2">
            Tomate 2 minutos para registrar cómo fue tu semana.
            <span className="block text-primary font-medium mt-1">
              No es un examen, es parte del proceso.
            </span>
          </p>
        </section>

        {/* Questions */}
        <section className="space-y-4">
          {questions.map((q, index) => (
            <Card 
              key={q.id} 
              wellness 
              className={`animate-slide-up stagger-${index + 1} opacity-0`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{q.question}</CardTitle>
              </CardHeader>
              <CardContent>
                {q.type === 'options' && q.options && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => handleOptionSelect(q.id, option)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300",
                          answers[q.id] === option
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'text' && (
                  <Textarea
                    placeholder={q.placeholder}
                    value={answers[q.id] as string || ''}
                    onChange={(e) => handleTextChange(q.id, e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                )}

                {q.type === 'slider' && (
                  <div className="space-y-4">
                    <Slider
                      value={[answers[q.id] as number || 5]}
                      onValueChange={(value) => handleSliderChange(q.id, value)}
                      max={10}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>0 - Nada</span>
                      <span className="text-lg font-display font-bold text-primary">
                        {answers[q.id] ?? 5}
                      </span>
                      <span>10 - Mucho</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Submit */}
        <section className="animate-slide-up stagger-5 opacity-0">
          <Button 
            variant="wellness" 
            size="lg" 
            className="w-full"
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            <Send className="h-5 w-5" />
            Enviar check-in
          </Button>
          {!isComplete && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              Completá todas las preguntas para enviar
            </p>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
