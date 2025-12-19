import { FileText, Upload, Edit, Trash2, File, Video, Music } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const contentTypes = [
  { id: 'pdfs', label: 'PDFs', icon: FileText, count: 3 },
  { id: 'videos', label: 'Videos', icon: Video, count: 2 },
  { id: 'audios', label: 'Audios', icon: Music, count: 5 },
  { id: 'textos', label: 'Textos', icon: File, count: 8 },
];

const recentContent = [
  { name: 'Plan Semana 1.pdf', type: 'pdf', updated: 'Hace 2 días' },
  { name: 'Mensaje bienvenida.mp3', type: 'audio', updated: 'Hace 1 semana' },
  { name: 'Técnicas de relajación.mp4', type: 'video', updated: 'Hace 2 semanas' },
  { name: 'Guía de porciones.pdf', type: 'pdf', updated: 'Hace 1 mes' },
];

export default function AdminContenidos() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            Contenidos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestión de materiales del programa
          </p>
        </div>
        <Button variant="wellness">
          <Upload className="h-4 w-4" />
          Subir archivo
        </Button>
      </div>

      {/* Content Types */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {contentTypes.map((type) => (
          <Card key={type.id} wellness className="cursor-pointer hover:scale-[1.02] transition-transform">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <type.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-2xl font-display font-bold text-foreground">
                  {type.count}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-3">{type.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Screen Texts */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Textos de pantallas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Inicio', 'Planning', 'Check-in', 'Situaciones', 'Información'].map((screen) => (
              <div 
                key={screen}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <span className="font-medium text-foreground">{screen}</span>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Content */}
      <Card wellness>
        <CardHeader>
          <CardTitle>Archivos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentContent.map((content, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    {content.type === 'pdf' && <FileText className="h-4 w-4 text-primary" />}
                    {content.type === 'audio' && <Music className="h-4 w-4 text-primary" />}
                    {content.type === 'video' && <Video className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.name}</p>
                    <p className="text-xs text-muted-foreground">{content.updated}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
