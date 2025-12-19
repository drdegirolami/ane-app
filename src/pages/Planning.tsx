import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Coffee, Sun, Moon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

// Sample meal data - would come from admin panel in production
const weeklyPlan = {
  Lunes: {
    desayuno: 'Yogur con frutas y avena',
    almuerzo: 'Pollo grillado con ensalada',
    cena: 'Sopa de verduras con tostadas',
  },
  Martes: {
    desayuno: 'Tostadas integrales con palta',
    almuerzo: 'Pescado al horno con vegetales',
    cena: 'Omelette de espinaca',
  },
  Miércoles: {
    desayuno: 'Licuado de banana y leche',
    almuerzo: 'Ensalada de atún con legumbres',
    cena: 'Wrap de pollo con verduras',
  },
  Jueves: {
    desayuno: 'Avena cocida con manzana',
    almuerzo: 'Milanesa de berenjena con arroz',
    cena: 'Ensalada tibia de vegetales',
  },
  Viernes: {
    desayuno: 'Huevos revueltos con pan integral',
    almuerzo: 'Pasta con salsa de tomate natural',
    cena: 'Pechuga de pollo con puré',
  },
  Sábado: {
    desayuno: 'Pancakes de avena',
    almuerzo: 'Carne magra con ensalada mixta',
    cena: 'Pizza casera de vegetales',
  },
  Domingo: {
    desayuno: 'Tostadas con queso y tomate',
    almuerzo: 'Asado magro con ensaladas',
    cena: 'Cena libre - porción moderada',
  },
};

const getTodayIndex = () => {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // Convert Sunday (0) to index 6
};

export default function Planning() {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const todayIndex = getTodayIndex();
  const todayName = weekDays[todayIndex];
  const todayPlan = weeklyPlan[todayName as keyof typeof weeklyPlan];

  const toggleDay = (day: string) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Planning Semanal
          </h1>
          <p className="text-muted-foreground mt-2">
            Este es el resumen de tu semana. Los detalles y recetas están en el plan en PDF.
          </p>
        </section>

        {/* Today's Highlight */}
        <section className="animate-slide-up stagger-1 opacity-0">
          <Card wellness className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-primary">Hoy - {todayName}</CardTitle>
                <div className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-medium">
                  Tu día
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <MealItem icon={Coffee} label="Desayuno" meal={todayPlan.desayuno} />
              <MealItem icon={Sun} label="Almuerzo" meal={todayPlan.almuerzo} />
              <MealItem icon={Moon} label="Cena" meal={todayPlan.cena} />
            </CardContent>
          </Card>
        </section>

        {/* Weekly Overview */}
        <section className="space-y-3 animate-slide-up stagger-2 opacity-0">
          <h2 className="text-lg font-display font-semibold text-foreground">
            Semana completa
          </h2>
          
          {weekDays.map((day, index) => {
            const plan = weeklyPlan[day as keyof typeof weeklyPlan];
            const isExpanded = expandedDay === day;
            const isToday = index === todayIndex;

            return (
              <Card 
                key={day} 
                wellness 
                className={cn(
                  "transition-all duration-300",
                  isToday && "ring-2 ring-primary/30"
                )}
              >
                <button
                  onClick={() => toggleDay(day)}
                  className="w-full text-left"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center font-display font-semibold text-sm",
                          isToday 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-secondary text-secondary-foreground"
                        )}>
                          {day.slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{day}</p>
                          {!isExpanded && (
                            <p className="text-xs text-muted-foreground">
                              {plan.almuerzo.split(' ').slice(0, 3).join(' ')}...
                            </p>
                          )}
                        </div>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border space-y-3">
                        <MealItem icon={Coffee} label="Desayuno" meal={plan.desayuno} />
                        <MealItem icon={Sun} label="Almuerzo" meal={plan.almuerzo} />
                        <MealItem icon={Moon} label="Cena" meal={plan.cena} />
                      </div>
                    )}
                  </CardContent>
                </button>
              </Card>
            );
          })}
        </section>

        {/* PDF Link */}
        <section className="animate-slide-up stagger-3 opacity-0">
          <Button variant="soft" className="w-full" size="lg">
            <FileText className="h-5 w-5" />
            Ver plan completo en PDF
          </Button>
        </section>
      </div>
    </AppLayout>
  );
}

function MealItem({ icon: Icon, label, meal }: { icon: any; label: string; meal: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4 text-secondary-foreground" />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm text-foreground mt-0.5">{meal}</p>
      </div>
    </div>
  );
}
