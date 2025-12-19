import { Play, Pause, User } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

// Sample message data - would come from admin panel in production
const weeklyMessage = {
  date: '16 de Diciembre, 2024',
  week: 'Semana 1',
  hasAudio: true,
  text: `Hola,

Espero que hayas podido arrancar bien esta semana. Recordá que los primeros días son de adaptación - no te preocupes si no sale todo perfecto.

Lo más importante ahora es:
• Respetar los horarios de las comidas
• No saltear ninguna comida
• Tomar suficiente agua

Si tenés dudas o algo no está funcionando, anotalo para que lo hablemos en la próxima consulta.

¡Buen comienzo de semana!`,
};

export default function Mensaje() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Mensaje del Médico
          </h1>
          <p className="text-muted-foreground mt-2">
            Tu mensaje semanal personalizado
          </p>
        </section>

        {/* Message Card */}
        <section className="animate-slide-up stagger-1 opacity-0">
          <Card wellness>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Dr. García</CardTitle>
                    <p className="text-sm text-muted-foreground">{weeklyMessage.week}</p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {weeklyMessage.date}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Audio Player */}
              {weeklyMessage.hasAudio && (
                <div className="p-4 rounded-xl bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="wellness"
                      size="icon"
                      className="h-12 w-12 rounded-full flex-shrink-0"
                      onClick={() => setIsPlaying(!isPlaying)}
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 ml-0.5" />
                      )}
                    </Button>
                    <div className="flex-1">
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: isPlaying ? '35%' : '0%' }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                        <span>{isPlaying ? '0:42' : '0:00'}</span>
                        <span>2:00</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Text Message */}
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground whitespace-pre-line leading-relaxed">
                  {weeklyMessage.text}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Previous Messages Note */}
        <section className="animate-slide-up stagger-2 opacity-0">
          <Card className="bg-muted/50 border-muted">
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground text-center">
                Los mensajes anteriores están disponibles en tu historial
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
