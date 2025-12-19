import { useState } from 'react';
import { Search, Plus, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const patients = [
  { id: 1, name: 'María García', email: 'maria@email.com', status: 'active', lastCheckin: 'Hace 2 días', week: 4 },
  { id: 2, name: 'Juan Pérez', email: 'juan@email.com', status: 'active', lastCheckin: 'Hoy', week: 2 },
  { id: 3, name: 'Ana López', email: 'ana@email.com', status: 'suspended', lastCheckin: 'Hace 1 semana', week: 8 },
  { id: 4, name: 'Carlos Ruiz', email: 'carlos@email.com', status: 'pending', lastCheckin: 'Nunca', week: 1 },
  { id: 5, name: 'Laura Martín', email: 'laura@email.com', status: 'active', lastCheckin: 'Ayer', week: 6 },
];

const statusConfig = {
  active: { label: 'Activo', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
  suspended: { label: 'Suspendido', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
};

export default function AdminPacientes() {
  const [search, setSearch] = useState('');
  
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de accesos y estados
          </p>
        </div>
        <Button variant="wellness">
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Patient List */}
      <Card wellness>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredPatients.map((patient) => {
              const status = statusConfig[patient.status as keyof typeof statusConfig];
              const StatusIcon = status.icon;

              return (
                <div 
                  key={patient.id}
                  className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">
                        {patient.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{patient.name}</p>
                      <p className="text-sm text-muted-foreground">{patient.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden sm:block text-right">
                      <p className="text-sm text-muted-foreground">Semana {patient.week}</p>
                      <p className="text-xs text-muted-foreground">{patient.lastCheckin}</p>
                    </div>
                    
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                      status.color
                    )}>
                      <StatusIcon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{status.label}</span>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Ver check-ins</DropdownMenuItem>
                        <DropdownMenuItem>
                          {patient.status === 'active' ? 'Suspender acceso' : 'Activar acceso'}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Dar de baja
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
