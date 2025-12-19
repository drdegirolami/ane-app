import { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, CheckCircle, XCircle, Clock, Loader2, User, ClipboardList } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Patient {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  status: string | null;
  created_at: string | null;
}

interface Checkin {
  id: string;
  created_at: string | null;
  week_rating: string | null;
  anxiety_level: number | null;
  plan_deviations: string | null;
  difficult_moment: string | null;
  adjustments_needed: string | null;
}

const statusConfig = {
  active: { label: 'Activo', icon: CheckCircle, color: 'text-green-500 bg-green-500/10' },
  suspended: { label: 'Suspendido', icon: XCircle, color: 'text-red-500 bg-red-500/10' },
  pending: { label: 'Pendiente', icon: Clock, color: 'text-amber-500 bg-amber-500/10' },
};

export default function AdminPacientes() {
  const [search, setSearch] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPatient, setNewPatient] = useState({ email: '', password: '', fullName: '' });
  
  // Profile dialog state
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [editingProfile, setEditingProfile] = useState({ fullName: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  
  // Checkins dialog state
  const [checkinsDialogOpen, setCheckinsDialogOpen] = useState(false);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [loadingCheckins, setLoadingCheckins] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar pacientes');
      console.error(error);
    } else {
      setPatients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const createPatient = async () => {
    if (!newPatient.email || !newPatient.password) {
      toast.error('Email y contraseña son requeridos');
      return;
    }

    if (newPatient.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setCreating(true);
    
    const { data, error } = await supabase.auth.signUp({
      email: newPatient.email,
      password: newPatient.password,
      options: {
        data: {
          full_name: newPatient.fullName,
        },
      },
    });

    if (error) {
      toast.error(`Error: ${error.message}`);
      console.error(error);
    } else {
      toast.success('Paciente creado correctamente');
      setDialogOpen(false);
      setNewPatient({ email: '', password: '', fullName: '' });
      setTimeout(fetchPatients, 1000);
    }
    setCreating(false);
  };

  const updatePatientStatus = async (patientId: string, newStatus: string) => {
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', patientId);

    if (error) {
      toast.error('Error al actualizar estado');
      console.error(error);
    } else {
      toast.success(`Estado actualizado a ${statusConfig[newStatus as keyof typeof statusConfig]?.label || newStatus}`);
      fetchPatients();
    }
  };

  const openProfileDialog = (patient: Patient) => {
    setSelectedPatient(patient);
    setEditingProfile({
      fullName: patient.full_name || '',
      email: patient.email || '',
    });
    setProfileDialogOpen(true);
  };

  const saveProfile = async () => {
    if (!selectedPatient) return;
    
    setSavingProfile(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: editingProfile.fullName,
        email: editingProfile.email,
      })
      .eq('id', selectedPatient.id);

    if (error) {
      toast.error('Error al guardar perfil');
      console.error(error);
    } else {
      toast.success('Perfil actualizado');
      setProfileDialogOpen(false);
      fetchPatients();
    }
    setSavingProfile(false);
  };

  const openCheckinsDialog = async (patient: Patient) => {
    setSelectedPatient(patient);
    setCheckinsDialogOpen(true);
    setLoadingCheckins(true);
    
    const { data, error } = await supabase
      .from('checkins')
      .select('*')
      .eq('user_id', patient.user_id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Error al cargar check-ins');
      console.error(error);
    } else {
      setCheckins(data || []);
    }
    setLoadingCheckins(false);
  };

  const deletePatient = async (patientId: string, patientName: string) => {
    const confirmed = window.confirm(`¿Estás seguro de dar de baja a ${patientName}?`);
    if (!confirmed) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', patientId);

    if (error) {
      toast.error('Error al dar de baja');
      console.error(error);
    } else {
      toast.success('Paciente dado de baja');
      fetchPatients();
    }
  };

  const filteredPatients = patients.filter(p => 
    (p.full_name?.toLowerCase().includes(search.toLowerCase()) || false) ||
    (p.email?.toLowerCase().includes(search.toLowerCase()) || false)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Pacientes
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de accesos y estados ({patients.length} pacientes)
          </p>
        </div>
        <Button variant="wellness" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nuevo paciente
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card wellness>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron pacientes
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredPatients.map((patient) => {
                const patientStatus = patient.status || 'pending';
                const status = statusConfig[patientStatus as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <div 
                    key={patient.id}
                    className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {patient.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{patient.full_name || 'Sin nombre'}</p>
                        <p className="text-sm text-muted-foreground">{patient.email || 'Sin email'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="hidden sm:block text-right">
                        <p className="text-xs text-muted-foreground">
                          {patient.created_at ? new Date(patient.created_at).toLocaleDateString('es-ES') : '-'}
                        </p>
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
                        <DropdownMenuContent align="end" className="bg-popover">
                          <DropdownMenuItem onClick={() => openProfileDialog(patient)}>
                            <User className="h-4 w-4 mr-2" />
                            Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openCheckinsDialog(patient)}>
                            <ClipboardList className="h-4 w-4 mr-2" />
                            Ver check-ins
                          </DropdownMenuItem>
                          {patientStatus === 'active' ? (
                            <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'suspended')}>
                              Suspender acceso
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => updatePatientStatus(patient.id, 'active')}>
                              Activar acceso
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => deletePatient(patient.id, patient.full_name || 'este paciente')}
                          >
                            Dar de baja
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input
                id="fullName"
                placeholder="Juan Pérez"
                value={newPatient.fullName}
                onChange={(e) => setNewPatient({ ...newPatient, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="paciente@email.com"
                value={newPatient.email}
                onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPatient.password}
                onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={createPatient} disabled={creating}>
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Crear paciente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perfil del Paciente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editFullName">Nombre completo</Label>
              <Input
                id="editFullName"
                value={editingProfile.fullName}
                onChange={(e) => setEditingProfile({ ...editingProfile, fullName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={editingProfile.email}
                onChange={(e) => setEditingProfile({ ...editingProfile, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <p className="text-sm text-muted-foreground">
                {statusConfig[selectedPatient?.status as keyof typeof statusConfig]?.label || 'Pendiente'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Fecha de registro</Label>
              <p className="text-sm text-muted-foreground">
                {selectedPatient?.created_at 
                  ? new Date(selectedPatient.created_at).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })
                  : '-'
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveProfile} disabled={savingProfile}>
              {savingProfile && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkins Dialog */}
      <Dialog open={checkinsDialogOpen} onOpenChange={setCheckinsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check-ins de {selectedPatient?.full_name || 'Paciente'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingCheckins ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : checkins.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Este paciente no tiene check-ins registrados
              </div>
            ) : (
              <div className="space-y-4">
                {checkins.map((checkin) => (
                  <Card key={checkin.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-foreground">
                        {checkin.created_at 
                          ? new Date(checkin.created_at).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : '-'
                        }
                      </span>
                      {checkin.week_rating && (
                        <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                          {checkin.week_rating}
                        </span>
                      )}
                    </div>
                    <div className="grid gap-2 text-sm">
                      {checkin.anxiety_level !== null && (
                        <div>
                          <span className="text-muted-foreground">Nivel de ansiedad: </span>
                          <span className="text-foreground">{checkin.anxiety_level}/10</span>
                        </div>
                      )}
                      {checkin.plan_deviations && (
                        <div>
                          <span className="text-muted-foreground">Desviaciones del plan: </span>
                          <span className="text-foreground">{checkin.plan_deviations}</span>
                        </div>
                      )}
                      {checkin.difficult_moment && (
                        <div>
                          <span className="text-muted-foreground">Momento difícil: </span>
                          <span className="text-foreground">{checkin.difficult_moment}</span>
                        </div>
                      )}
                      {checkin.adjustments_needed && (
                        <div>
                          <span className="text-muted-foreground">Ajustes necesarios: </span>
                          <span className="text-foreground">{checkin.adjustments_needed}</span>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckinsDialogOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
