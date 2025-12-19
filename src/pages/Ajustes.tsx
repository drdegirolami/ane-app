import { Sun, Moon, Palette, Check, LogOut, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme, palettes } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import AppLayout from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function Ajustes() {
  const { mode, palette, setMode, setPalette } = useTheme();
  const { signOut, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    toast.success('Sesión cerrada');
    navigate('/auth');
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <section className="animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Ajustes
          </h1>
          <p className="text-muted-foreground mt-2">
            Personalizá tu experiencia
          </p>
        </section>

        {/* Theme Mode */}
        <section className="animate-slide-up stagger-1 opacity-0">
          <Card wellness>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {mode === 'light' ? (
                    <Sun className="h-5 w-5 text-primary" />
                  ) : (
                    <Moon className="h-5 w-5 text-primary" />
                  )}
                </div>
                <CardTitle>Modo de pantalla</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={mode === 'light' ? 'default' : 'outline'}
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setMode('light')}
                >
                  <Sun className="h-6 w-6" />
                  <span>Día</span>
                </Button>
                <Button
                  variant={mode === 'dark' ? 'default' : 'outline'}
                  className="h-auto py-4 flex-col gap-2"
                  onClick={() => setMode('dark')}
                >
                  <Moon className="h-6 w-6" />
                  <span>Noche</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Color Palette */}
        <section className="animate-slide-up stagger-2 opacity-0">
          <Card wellness>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <CardTitle>Paleta de colores</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-3">
                {palettes.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPalette(p.id)}
                    className={cn(
                      "relative aspect-square rounded-xl transition-all duration-300 hover:scale-110",
                      palette === p.id && "ring-2 ring-offset-2 ring-offset-background ring-foreground"
                    )}
                    style={{ backgroundColor: p.color }}
                    title={p.name}
                  >
                    {palette === p.id && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Check className="h-5 w-5 text-white drop-shadow-md" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-3 text-center">
                {palettes.find(p => p.id === palette)?.name}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Account Section */}
        <section className="animate-slide-up stagger-3 opacity-0 space-y-3">
          {isAdmin && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-14"
              onClick={() => navigate('/admin')}
            >
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="font-medium">Panel de Administrador</span>
            </Button>
          )}
          
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-14 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleLogout}
          >
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <span className="font-medium">Cerrar Sesión</span>
          </Button>
        </section>
      </div>
    </AppLayout>
  );
}
