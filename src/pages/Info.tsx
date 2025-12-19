import { Shield, Heart, Phone, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/components/layout/AppLayout';

export default function Info() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Información del Programa
          </h1>
        </section>

        {/* Main Info Card */}
        <section className="animate-slide-up stagger-1 opacity-0">
          <Card wellness>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Sobre esta aplicación</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Esta aplicación es una <strong>herramienta de acompañamiento</strong> diseñada 
                para ayudarte a sostener tu proceso nutricional entre consultas médicas.
              </p>
              
              <div className="p-4 rounded-xl bg-accent/10 border border-accent/20">
                <p className="text-sm text-foreground">
                  <strong>Importante:</strong> Esta app no reemplaza la consulta médica 
                  ni el criterio profesional. Las decisiones clínicas se realizan 
                  únicamente en consulta.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Purpose Card */}
        <section className="animate-slide-up stagger-2 opacity-0">
          <Card wellness>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Heart className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Nuestro objetivo</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Organizar tu proceso entre consultas',
                  'Reducir la ansiedad y la improvisación',
                  'Acompañarte en momentos difíciles',
                  'Facilitar el seguimiento de tu progreso',
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Contact Card */}
        <section className="animate-slide-up stagger-3 opacity-0">
          <Card wellness>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <a 
                href="tel:+5491112345678" 
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-foreground">+54 9 11 1234-5678</span>
              </a>
              <a 
                href="mailto:consultas@ejemplo.com" 
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-foreground">consultas@ejemplo.com</span>
              </a>
            </CardContent>
          </Card>
        </section>

        {/* Version */}
        <section className="animate-slide-up stagger-4 opacity-0 text-center">
          <p className="text-sm text-muted-foreground">
            Versión 1.0.0
          </p>
        </section>
      </div>
    </AppLayout>
  );
}
