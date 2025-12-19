import { Users, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Pacientes activos', value: '24', icon: Users, color: 'text-primary' },
  { label: 'Check-ins esta semana', value: '18', icon: CheckCircle, color: 'text-green-500' },
  { label: 'Pendientes de pago', value: '3', icon: AlertCircle, color: 'text-amber-500' },
  { label: 'Tasa de retención', value: '92%', icon: TrendingUp, color: 'text-primary' },
];

const recentActivity = [
  { patient: 'María García', action: 'Completó check-in semanal', time: 'Hace 2h' },
  { patient: 'Juan Pérez', action: 'Nuevo registro', time: 'Hace 5h' },
  { patient: 'Ana López', action: 'Pago confirmado', time: 'Ayer' },
  { patient: 'Carlos Ruiz', action: 'Acceso suspendido', time: 'Hace 2 días' },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Resumen general del programa
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} wellness>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-display font-bold text-foreground mt-1">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Acciones rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link to="/admin/pacientes">
              <Button variant="soft">Agregar paciente</Button>
            </Link>
            <Link to="/admin/mensajes">
              <Button variant="soft">Nuevo mensaje semanal</Button>
            </Link>
            <Link to="/admin/planning">
              <Button variant="soft">Editar planning</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Actividad reciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium text-foreground">{activity.patient}</p>
                  <p className="text-sm text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
