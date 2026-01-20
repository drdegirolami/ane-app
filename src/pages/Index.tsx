import { Link } from 'react-router-dom';
import { Calendar, ClipboardList, AlertTriangle, MessageCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';
import { useMyNextStep } from '@/hooks/useMyNextStep';
import { useAuth } from '@/hooks/useAuth';
const menuItems = [
  {
    path: '/planning',
    icon: Calendar,
    title: 'Ver planning semanal',
    description: 'Tu guía de comidas para esta semana',
    color: 'from-primary to-primary/70',
  },
  {
    path: '/checkin',
    icon: ClipboardList,
    title: 'Cómo fue mi semana',
    description: 'Registra tu experiencia en 2 minutos',
    color: 'from-accent to-accent/70',
  },
  {
    path: '/situaciones',
    icon: AlertTriangle,
    title: 'Situaciones difíciles',
    description: 'Estrategias para momentos complicados',
    color: 'from-secondary-foreground/80 to-secondary-foreground/60',
  },
  {
    path: '/mensaje',
    icon: MessageCircle,
    title: 'Mensaje del médico',
    description: 'Tu mensaje semanal personalizado',
    color: 'from-primary/90 to-accent/70',
  },
];

export default function Index() {
  const { data: nextStep, isLoading } = useMyNextStep();
  const { user } = useAuth();
  
  const userName = user?.user_metadata?.full_name || 'Usuario';
  const userEmail = user?.email || '';
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-8">
        {/* Welcome Section */}
        <section className="text-center space-y-4 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            <span>Semana 1</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
            Tu proceso esta semana
          </h1>
          
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            Este espacio te ayuda a sostener el plan entre consultas.
            <span className="block mt-2 text-primary font-medium">
              No buscamos perfección, buscamos continuidad.
            </span>
          </p>
        </section>

        {/* User Info */}
        <section className="text-center animate-fade-in">
          <div className="inline-flex flex-col items-center gap-1 px-4 py-3 rounded-xl bg-muted/50 border border-border">
            <span className="text-sm font-medium text-foreground">
              {userName}
            </span>
            <span className="text-xs text-muted-foreground">
              {userEmail}
            </span>
          </div>
        </section>

        {/* Next Step CTA */}
        <section className="animate-slide-up">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-5">
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-foreground">
                  ¿Qué sigue ahora?
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isLoading 
                    ? 'Verificando tu próximo paso…'
                    : nextStep?.available 
                      ? nextStep.next_step_title
                      : 'Tu próximo paso aparecerá aquí.'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Menu Cards */}
        <section className="space-y-4">
          {menuItems.map((item, index) => (
            <Link key={item.path} to={item.path}>
              <Card 
                wellness 
                className={`animate-slide-up stagger-${index + 1} opacity-0 hover:scale-[1.02] cursor-pointer group`}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                      <item.icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </section>

        {/* Daily Reminder */}
        <section className="animate-slide-up stagger-5 opacity-0">
          <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 animate-pulse-soft" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Recordá: cada día es una oportunidad nueva.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Lo importante es retomar, no ser perfecto.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}
