// Cálculo del mes y la fase del programa ANE a partir de la fecha de inicio.
// Fase 1: meses 1-2 (arranque) · Fase 2: meses 3-4 (sostener) · Fase 3: meses 5-6 (consolidar)

export interface ProgramProgress {
  /** Mes del programa, 1-based. null si no hay fecha de inicio. */
  month: number | null;
  /** Fase 1, 2 o 3. null si no hay fecha de inicio. */
  phase: 1 | 2 | 3 | null;
  /** Etiqueta corta para mostrar, ej. "Mes 3 · Fase 2". */
  label: string;
  /** Nombre descriptivo de la fase. */
  phaseName: string;
  /** true cuando el paciente superó el mes 6 del programa. */
  finished: boolean;
}

const PHASE_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Arranque',
  2: 'Sostener el cambio',
  3: 'Consolidar la identidad',
};

export function monthsSince(startDate: string | null | undefined): number | null {
  if (!startDate) return null;
  const start = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(start.getTime())) return null;

  const now = new Date();
  let months =
    (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

export function phaseForMonth(month: number): 1 | 2 | 3 {
  if (month <= 2) return 1;
  if (month <= 4) return 2;
  return 3;
}

export function getProgramProgress(startDate: string | null | undefined): ProgramProgress {
  const elapsed = monthsSince(startDate);

  if (elapsed === null) {
    return {
      month: null,
      phase: null,
      label: 'Sin fecha de inicio',
      phaseName: '',
      finished: false,
    };
  }

  const month = elapsed + 1; // el primer mes es el mes 1
  const finished = month > 6;
  const phase = phaseForMonth(Math.min(month, 6));

  return {
    month,
    phase,
    phaseName: PHASE_NAMES[phase],
    finished,
    label: finished
      ? `Mes ${month} · Programa completado`
      : `Mes ${month} · Fase ${phase} (${PHASE_NAMES[phase]})`,
  };
}

export function formatStartDate(startDate: string | null | undefined): string {
  if (!startDate) return 'Sin definir';
  const d = new Date(`${startDate.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return 'Sin definir';
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });
}
