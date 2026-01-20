import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/components/layout/AppLayout';

export default function EvaluacionInicial() {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground -ml-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Evaluación inicial
        </h1>
        <p className="text-muted-foreground">
          Pantalla de prueba
        </p>
      </div>
    </AppLayout>
  );
}
