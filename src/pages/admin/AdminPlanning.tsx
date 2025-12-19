import { useState, useEffect } from 'react';
import { Calendar, Save, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const weekDays = [
  { index: 0, name: 'Lunes' },
  { index: 1, name: 'Martes' },
  { index: 2, name: 'Miércoles' },
  { index: 3, name: 'Jueves' },
  { index: 4, name: 'Viernes' },
  { index: 5, name: 'Sábado' },
  { index: 6, name: 'Domingo' },
];

interface DayPlan {
  id?: string;
  day_of_week: number;
  breakfast: string;
  lunch: string;
  dinner: string;
}

export default function AdminPlanning() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<DayPlan[]>(
    weekDays.map(day => ({
      day_of_week: day.index,
      breakfast: '',
      lunch: '',
      dinner: '',
    }))
  );

  useEffect(() => {
    fetchPlanning();
  }, []);

  const fetchPlanning = async () => {
    try {
      const { data, error } = await supabase
        .from('weekly_planning')
        .select('*')
        .order('day_of_week');

      if (error) throw error;

      if (data && data.length > 0) {
        const updatedPlans = weekDays.map(day => {
          const existing = data.find(p => p.day_of_week === day.index);
          return existing ? {
            id: existing.id,
            day_of_week: existing.day_of_week,
            breakfast: existing.breakfast || '',
            lunch: existing.lunch || '',
            dinner: existing.dinner || '',
          } : {
            day_of_week: day.index,
            breakfast: '',
            lunch: '',
            dinner: '',
          };
        });
        setPlans(updatedPlans);
      }
    } catch (error) {
      console.error('Error fetching planning:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el planning",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePlan = (dayIndex: number, field: keyof DayPlan, value: string) => {
    setPlans(prev => prev.map(plan => 
      plan.day_of_week === dayIndex 
        ? { ...plan, [field]: value }
        : plan
    ));
  };

  const savePlanning = async () => {
    setSaving(true);
    try {
      for (const plan of plans) {
        if (plan.id) {
          const { error } = await supabase
            .from('weekly_planning')
            .update({
              breakfast: plan.breakfast,
              lunch: plan.lunch,
              dinner: plan.dinner,
            })
            .eq('id', plan.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('weekly_planning')
            .insert({
              day_of_week: plan.day_of_week,
              breakfast: plan.breakfast,
              lunch: plan.lunch,
              dinner: plan.dinner,
            });
          if (error) throw error;
        }
      }

      toast({
        title: "Guardado",
        description: "El planning se ha guardado correctamente",
      });
      fetchPlanning();
    } catch (error) {
      console.error('Error saving planning:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el planning",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Planning Semanal
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona el menú semanal de los pacientes
          </p>
        </div>
        <Button variant="wellness" onClick={savePlanning} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Guardar cambios
        </Button>
      </div>

      <div className="grid gap-4">
        {weekDays.map((day) => {
          const plan = plans.find(p => p.day_of_week === day.index);
          return (
            <Card key={day.index} wellness>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  {day.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Desayuno</Label>
                    <Input
                      value={plan?.breakfast || ''}
                      onChange={(e) => updatePlan(day.index, 'breakfast', e.target.value)}
                      placeholder="Ej: Tostadas con aguacate"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Comida</Label>
                    <Input
                      value={plan?.lunch || ''}
                      onChange={(e) => updatePlan(day.index, 'lunch', e.target.value)}
                      placeholder="Ej: Ensalada mediterránea"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cena</Label>
                    <Input
                      value={plan?.dinner || ''}
                      onChange={(e) => updatePlan(day.index, 'dinner', e.target.value)}
                      placeholder="Ej: Salmón al horno"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
