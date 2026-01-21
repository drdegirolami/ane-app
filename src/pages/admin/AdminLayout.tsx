import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Calendar, 
  MessageSquare, 
  AlertTriangle, 
  Settings,
  LayoutDashboard,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminNavItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/pacientes', icon: Users, label: 'Pacientes' },
  { path: '/admin/evaluaciones', icon: FileText, label: 'Evaluaciones' },
  { path: '/admin/contenidos', icon: FileText, label: 'Contenidos' },
  { path: '/admin/planning', icon: Calendar, label: 'Planning' },
  { path: '/admin/mensajes', icon: MessageSquare, label: 'Mensajes' },
  { path: '/admin/situaciones', icon: AlertTriangle, label: 'Situaciones' },
  { path: '/admin/ajustes', icon: Settings, label: 'Ajustes' },
];

export default function AdminLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-card border-r border-border hidden lg:block">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Volver a la app</span>
          </Link>
          
          <div className="mt-6">
            <h1 className="font-display font-bold text-xl text-foreground">
              Panel Admin
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gestión del programa
            </p>
          </div>
        </div>

        <nav className="px-3 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path) && item.path !== '/admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Volver</span>
          </Link>
          <h1 className="font-display font-bold text-foreground">Panel Admin</h1>
          <div className="w-16" />
        </div>
        
        {/* Mobile Nav */}
        <div className="flex overflow-x-auto px-4 pb-3 gap-2 scrollbar-hide">
          {adminNavItems.map((item) => {
            const isActive = item.exact 
              ? location.pathname === item.path
              : location.pathname.startsWith(item.path) && item.path !== '/admin';
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="container max-w-5xl py-6 px-4 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
