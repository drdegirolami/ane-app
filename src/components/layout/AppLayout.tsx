import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, ClipboardList, AlertTriangle, MessageCircle, Info, Settings, Moon, Sun, Shield } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { path: '/', icon: Home, label: 'Inicio' },
  { path: '/planning', icon: Calendar, label: 'Planning' },
  { path: '/checkin', icon: ClipboardList, label: 'Check-in' },
  { path: '/situaciones', icon: AlertTriangle, label: 'Situaciones' },
  { path: '/mensaje', icon: MessageCircle, label: 'Mensaje' },
  { path: '/info', icon: Info, label: 'Info' },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const { mode, toggleMode } = useTheme();
  const { isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-sm">PN</span>
            </div>
            <span className="font-display font-semibold text-foreground hidden sm:block">
              Programa Nutricional
            </span>
          </Link>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="rounded-xl gap-2 text-primary border-primary/30 hover:bg-primary/10">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Panel Admin</span>
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMode}
              className="rounded-xl"
            >
              {mode === 'light' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Link to="/ajustes">
              <Button variant="ghost" size="icon" className="rounded-xl">
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border">
        <div className="container flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-300",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive && "animate-scale-in")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
