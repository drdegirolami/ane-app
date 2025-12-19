import { useState } from 'react';
import { Moon, Calendar, MapPin, Brain, TrendingDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

const situations = [
  {
    id: 'noche',
    icon: Moon,
    title: 'Noche',
    description: 'Estrategias para las noches difíciles',
    tips: [
      'Prepará infusiones sin azúcar para después de cenar',
      'Lavate los dientes inmediatamente después de la última comida',
      'Tené a mano snacks permitidos si hay antojo fuerte',
      'Evitá la cocina después de cenar',
    ],
  },
  {
    id: 'fines',
    icon: Calendar,
    title: 'Fines de semana',
    description: 'Cómo manejar los cambios de rutina',
    tips: [
      'Mantené los horarios de comidas similares a la semana',
      'Planificá con anticipación las comidas del fin de semana',
      'Si hay evento social, comé algo antes de ir',
      'Elegí una sola opción de excepción, no todas',
    ],
  },
  {
    id: 'salidas',
    icon: MapPin,
    title: 'Salidas',
    description: 'Eventos sociales y restaurantes',
    tips: [
      'Mirá el menú antes de ir y decidí qué vas a pedir',
      'Empezá con ensalada o verduras',
      'Pedí el plato sin salsas o aparte',
      'No llegues con mucha hambre - comé algo liviano antes',
    ],
  },
  {
    id: 'ansiedad',
    icon: Brain,
    title: 'Ansiedad',
    description: 'Cuando la ansiedad empuja a comer',
    tips: [
      'Esperá 10 minutos antes de comer - muchas veces pasa',
      'Tomá un vaso de agua y respirá profundo',
      'Salí a caminar aunque sea 5 minutos',
      'Llamá a alguien o escribí cómo te sentís',
    ],
  },
  {
    id: 'estancamiento',
    icon: TrendingDown,
    title: 'Estancamiento',
    description: 'Cuando el peso no baja',
    tips: [
      'Es normal - el cuerpo necesita tiempo para ajustarse',
      'Revisá si hay algo que puedas mejorar sin obsesionarte',
      'Enfocate en cómo te sentís, no solo en el número',
      'Hablalo en la próxima consulta',
    ],
  },
];

export default function Situaciones() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Situaciones Difíciles
          </h1>
          <p className="text-muted-foreground mt-2">
            No buscamos perfección.
            <span className="block text-primary font-medium mt-1">
              Buscamos atravesar el momento sin romper el proceso.
            </span>
          </p>
        </section>

        {/* Situations */}
        <section className="space-y-3">
          {situations.map((situation, index) => {
            const isExpanded = expanded === situation.id;
            const Icon = situation.icon;

            return (
              <Card 
                key={situation.id} 
                wellness 
                className={`animate-slide-up stagger-${index + 1} opacity-0 cursor-pointer`}
                onClick={() => setExpanded(isExpanded ? null : situation.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground">
                        {situation.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {situation.description}
                      </p>
                    </div>
                    <ChevronRight 
                      className={cn(
                        "h-5 w-5 text-muted-foreground transition-transform duration-300",
                        isExpanded && "rotate-90"
                      )} 
                    />
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
                      {situation.tips.map((tip, tipIndex) => (
                        <div key={tipIndex} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-xs font-bold text-primary">
                              {tipIndex + 1}
                            </span>
                          </div>
                          <p className="text-sm text-foreground">{tip}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </section>

        {/* Encouragement */}
        <section className="animate-slide-up stagger-5 opacity-0">
          <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <CardContent className="p-5 text-center">
              <p className="text-foreground font-medium">
                Cada momento difícil que atravesás sin abandonar
              </p>
              <p className="text-primary font-display font-semibold mt-1">
                es un paso más en tu proceso.
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
