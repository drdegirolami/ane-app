// Cálculo del perfil conductual dominante a partir de las respuestas
// del test "Diagnóstico inicial — Perfil conductual".

export const DIAGNOSTIC_SLUG = 'diagnostico_inicial_perfil_conductual';

export type ProfileSlug =
  | 'el_que_se_relaja'
  | 'el_ansioso'
  | 'el_desorganizado'
  | 'el_compulsivo'
  | 'el_depresivo_leve'
  | 'el_obsesivo_perfeccionista'
  | 'el_picoteador';

export interface ProfileScore {
  slug: ProfileSlug;
  score: number;
}

export interface ProfileSuggestion {
  primary: ProfileSlug | null;
  secondary: ProfileSlug | null;
  scores: ProfileScore[];
  rationale: string[];
}

type Answers = Record<string, unknown>;

const asArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(String) : typeof v === 'string' && v ? [v] : [];

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');

/**
 * Reglas de puntuación por perfil. Los pesos priorizan la
 * autodescripción del paciente (perfil_emocional) sobre los indicios
 * indirectos (momento del día, reacción al desliz, organización).
 */
export function inferProfile(answersJson: unknown): ProfileSuggestion {
  const answers: Answers = (answersJson && typeof answersJson === 'object' ? answersJson : {}) as Answers;

  const scores: Record<ProfileSlug, number> = {
    el_que_se_relaja: 0,
    el_ansioso: 0,
    el_desorganizado: 0,
    el_compulsivo: 0,
    el_depresivo_leve: 0,
    el_obsesivo_perfeccionista: 0,
    el_picoteador: 0,
  };
  const rationale: string[] = [];

  const add = (slug: ProfileSlug, points: number, reason: string) => {
    scores[slug] += points;
    rationale.push(`${reason} (+${points})`);
  };

  // 1. Autodescripción emocional — señal más fuerte
  const emocional = asArray(answers.perfil_emocional);
  const emocionalMap: Partial<Record<string, ProfileSlug>> = {
    ansioso: 'el_ansioso',
    obsesivo: 'el_obsesivo_perfeccionista',
    impulsivo: 'el_compulsivo',
    depresivo_leve: 'el_depresivo_leve',
    picoteador: 'el_picoteador',
    se_relaja: 'el_que_se_relaja',
  };
  emocional.forEach((v) => {
    const slug = emocionalMap[v];
    if (slug) add(slug, 4, `Se describe como "${v}"`);
  });

  // 2. Momento del proceso en que aparece el desorden
  const momentoDesorden = asString(answers.momento_desorden);
  if (momentoDesorden === 'al_bajar') add('el_que_se_relaja', 3, 'El desorden aparece al bajar de peso');
  if (momentoDesorden === 'desde_inicio') add('el_ansioso', 2, 'El desorden aparece ante la desestabilización');
  if (momentoDesorden === 'aburrimiento') add('el_picoteador', 3, 'El desorden aparece con la monotonía');
  if (momentoDesorden === 'sin_patron') add('el_desorganizado', 2, 'No identifica un patrón claro');

  // 3. Momento crítico del día
  const momentoDia = asString(answers.momento_dia);
  if (momentoDia === 'noche') add('el_ansioso', 2, 'Momento crítico: la noche');
  if (momentoDia === 'tarde') add('el_picoteador', 2, 'Momento crítico: la tarde');
  if (momentoDia === 'todo_el_dia') add('el_picoteador', 4, 'Picoteo constante a lo largo del día');
  if (momentoDia === 'estres_sin_hora') add('el_ansioso', 3, 'Come ante estrés sin horario fijo');
  if (momentoDia === 'sin_momento') add('el_desorganizado', 1, 'Sin momento crítico definido');

  // 4. Reacción ante el desliz
  const reaccion = asString(answers.reaccion_desliz);
  if (reaccion === 'culpa') add('el_depresivo_leve', 2, 'Culpa que dificulta retomar');
  if (reaccion === 'abandono') add('el_compulsivo', 3, 'Abandona el plan tras el desliz');
  if (reaccion === 'compensacion') add('el_obsesivo_perfeccionista', 3, 'Compensa restringiendo después');
  if (reaccion === 'autocritica') add('el_obsesivo_perfeccionista', 2, 'Autocrítica dura');

  // 5. Organización
  const organizacion = asString(answers.organizacion);
  if (organizacion === 'desorganizado') add('el_desorganizado', 4, 'Rutina caótica');
  if (organizacion === 'moderado') add('el_desorganizado', 1, 'Organización intermitente');
  if (organizacion === 'organizado') add('el_obsesivo_perfeccionista', 1, 'Alta organización');

  // 6. Disparadores
  const disparadores = asArray(answers.disparador_principal);
  if (disparadores.includes('estres')) add('el_ansioso', 2, 'Disparador: estrés');
  if (disparadores.includes('ansiedad')) add('el_ansioso', 3, 'Disparador: ansiedad sin causa clara');
  if (disparadores.includes('aburrimiento')) add('el_picoteador', 3, 'Disparador: aburrimiento o vacío');
  if (disparadores.includes('estado_animico')) add('el_depresivo_leve', 3, 'Disparador: tristeza o angustia');
  if (disparadores.includes('cansancio')) add('el_depresivo_leve', 1, 'Disparador: cansancio');
  if (disparadores.includes('social')) add('el_que_se_relaja', 1, 'Disparador: situaciones sociales');
  if (disparadores.includes('sin_disparador')) add('el_desorganizado', 1, 'No identifica disparadores');

  // 7. Conciencia del patrón (matiza, no define)
  if (asString(answers.conciencia_patron) === 'bajo') add('el_desorganizado', 1, 'Baja conciencia del patrón');

  const ranked = (Object.keys(scores) as ProfileSlug[])
    .map((slug) => ({ slug, score: scores[slug] }))
    .sort((a, b) => b.score - a.score);

  const primary = ranked[0]?.score > 0 ? ranked[0].slug : null;
  const secondary = ranked[1]?.score > 0 && ranked[1].score >= 3 ? ranked[1].slug : null;

  return { primary, secondary, scores: ranked, rationale };
}
