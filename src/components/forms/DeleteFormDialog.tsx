import { useState } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useDeleteFormTemplate } from '@/hooks/useFormTemplates';
import type { FormTemplate } from '@/hooks/useFormTemplates';

interface DeleteFormDialogProps {
  template: FormTemplate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function DeleteFormDialog({ template, open, onOpenChange }: DeleteFormDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteMutation = useDeleteFormTemplate();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(template.id);
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Eliminar formulario
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              ¿Estás seguro que deseas eliminar <strong>"{template.title}"</strong>?
            </p>
            <p className="text-destructive">
              Esta acción eliminará también todas las respuestas de pacientes asociadas 
              y no se puede deshacer.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
