-- Fix malformed slug
UPDATE public.form_templates SET slug = 'tipo_hambre_predominante' WHERE slug = ': tipo_hambre_predominante';

-- Clinical profiles catalog
CREATE TABLE public.clinical_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  patient_text text,
  show_to_patient boolean NOT NULL DEFAULT true,
  clinical_attitude text,
  behavioral_tasks text[] NOT NULL DEFAULT '{}',
  warning_signs text[] NOT NULL DEFAULT '{}',
  priority_test_slugs text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clinical_profiles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.clinical_profiles TO authenticated;
GRANT ALL ON public.clinical_profiles TO service_role;

ALTER TABLE public.clinical_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage clinical profiles"
  ON public.clinical_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read active profiles"
  ON public.clinical_profiles FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TRIGGER update_clinical_profiles_updated_at
  BEFORE UPDATE ON public.clinical_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Profile assignments (with history)
CREATE TABLE public.patient_profile_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_profile_id uuid REFERENCES public.clinical_profiles(id) ON DELETE SET NULL,
  secondary_profile_id uuid REFERENCES public.clinical_profiles(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'manual',
  notes text,
  assigned_by uuid,
  assigned_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ppa_patient ON public.patient_profile_assignments (patient_id, assigned_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.patient_profile_assignments TO authenticated;
GRANT ALL ON public.patient_profile_assignments TO service_role;

ALTER TABLE public.patient_profile_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage profile assignments"
  ON public.patient_profile_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Patients can view own profile assignments"
  ON public.patient_profile_assignments FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

-- Seed the 7 profiles from the method document
INSERT INTO public.clinical_profiles (slug, name, description, patient_text, clinical_attitude, behavioral_tasks, warning_signs, priority_test_slugs, sort_order) VALUES
('el_que_se_relaja', 'El que se relaja cuando baja',
 'Logra bajar de peso, llega a un punto de logro, baja la guardia y pierde la estructura. El problema no es arrancar sino sostener cuando ya no siente urgencia.',
 'Arrancar te resulta más fácil que sostener. Cuando ves resultados, aflojás la estructura. Vamos a trabajar en que el cambio se sostenga más allá del número de la balanza.',
 'No celebrar demasiado los logros de peso — reforzar la importancia de la fase de consolidación desde el inicio.',
 ARRAY['Redefinir el objetivo más allá del peso','Trabajar la identidad post-descenso','Establecer señales de alarma personalizadas'],
 ARRAY['Deja de registrar cuando baja de peso','Espacia las consultas tras un logro','Vuelve a hábitos previos sin registrarlo'],
 ARRAY['revision_primer_tramo','senales_tempranas_recaida','test_mes4_trampa_del_exito'], 1),
('el_ansioso', 'El ansioso',
 'Come por ansiedad, especialmente ante situaciones de estrés o incertidumbre. La comida funciona como regulador rápido del displacer. Suele tener dificultad para tolerar la espera y la imperfección.',
 'La comida aparece como una forma rápida de calmar la ansiedad. No se trata de tener más fuerza de voluntad, sino de aprender a interrumpir ese automatismo y encontrar otras formas de regularte.',
 'Validar la ansiedad como real, no minimizarla. No pedir control puro — pedir interrupción del automatismo.',
 ARRAY['Identificación del disparador ansioso','Técnicas de pausa antes de comer','Actividades alternativas de regulación','Manejo de la urgencia'],
 ARRAY['Aumento de episodios ante estrés','Come de noche o a escondidas','Reporta urgencia incontrolable'],
 ARRAY['debq_1_comer_emocional','test_mes3_estados_animo_elecciones','tipo_hambre_predominante'], 2),
('el_desorganizado', 'El desorganizado',
 'Su problema no es emocional sino estructural. No tiene rutinas estables, improvisa las comidas, se olvida de comer y después come de más, no planifica la semana.',
 'Tu dificultad no es emocional, es de organización. Cuando el día se improvisa, la alimentación se desordena. Vamos a construir una rutina mínima y sostenible.',
 'No pedirle perfección estructural — pedirle un mínimo no negociable. Reforzar la planificación como herramienta clínica.',
 ARRAY['Armar una rutina mínima de comidas','Planning semanal simple','Lista de compras','Anticipación de días caóticos'],
 ARRAY['Semanas sin planificación','Saltea comidas y compensa de noche','No completa el planning semanal'],
 ARRAY['test_organizacion_semanal_planning','test_1_1_organizacion_vs_voluntad'], 3),
('el_compulsivo', 'El compulsivo',
 'Episodios de ingesta impulsiva, generalmente rápida y sin registro consciente. Suele comer en exceso en poco tiempo y luego sentir culpa intensa. El patrón es más intenso que el del ansioso.',
 'Hay momentos en los que comés de forma rápida y casi sin darte cuenta, y después aparece la culpa. El primer paso no es controlarlo, es entenderlo y registrarlo sin juzgarte.',
 'No pedir control del episodio en sí — pedir registro y comprensión. Evitar el refuerzo del pensamiento todo-o-nada.',
 ARRAY['Registro de episodios sin juicio','Identificación del momento previo al episodio','Interrupción del automatismo','Trabajo sobre la culpa post-episodio'],
 ARRAY['Aumento de frecuencia o intensidad de los episodios','Culpa intensa persistente','Aislamiento o vergüenza ligada a la comida'],
 ARRAY['bes_ingesta_compulsiva','debq_1_comer_emocional','test_reaccion_ante_desvios_del_plan'], 4),
('el_depresivo_leve', 'El depresivo leve',
 'Estados de ánimo bajos que generan desorganización alimentaria. No es depresión clínica mayor, pero hay días de baja energía, desmotivación y pérdida de estructura. La comida aparece como fuente de placer accesible.',
 'Hay días de baja energía en los que todo cuesta más y la comida aparece como el placer más a mano. Vamos a trabajar con mínimos alcanzables para esos días, sin exigirte de más.',
 'No presionar en los días de baja energía. Dar un mínimo alcanzable. Monitorear si el estado de ánimo requiere derivación a salud mental.',
 ARRAY['Identificación de días de riesgo','Activación conductual mínima','Refuerzo de actividades placenteras alternativas','Trabajo sobre el estancamiento'],
 ARRAY['Días seguidos sin actividad ni registro','Desmotivación sostenida','Señales que sugieren derivación a salud mental'],
 ARRAY['test_mes3_estados_animo_elecciones','proceso_silencioso_autoregistro_6_2','meseta_real_vs_frustracion'], 5),
('el_obsesivo_perfeccionista', 'El obsesivo / perfeccionista',
 'Sigue el plan con rigidez excesiva y cuando algo falla (un desliz, una comida fuera del plan) entra en espiral de culpa o abandono. El tratamiento en sí puede convertirse en una carga mental pesada.',
 'Cumplís el plan con mucha exigencia, y por eso un desliz pesa demasiado. Vamos a trabajar la flexibilidad: el objetivo es sostener el proceso, no ser perfecto.',
 'No reforzar la perfección como objetivo. Pedir proceso, no resultado perfecto. Validar el esfuerzo sin exigir rendimiento.',
 ARRAY['Trabajar la flexibilidad como herramienta clínica','Normalizar el desliz','Reducir el costo mental del tratamiento','Establecer mínimos posibles'],
 ARRAY['Abandono tras un desliz','Discurso todo-o-nada','Vive el tratamiento como carga mental'],
 ARRAY['debq_3_comer_restrictivo','test_reaccion_ante_desvios_del_plan','comer_con_mas_libertad_sin_perder_el_rumbo'], 6),
('el_picoteador', 'El picoteador',
 'Come frecuentemente en pequeñas cantidades a lo largo del día, creyendo que tiene hambre real. En la mayoría de los casos es displacer cerebral por el estado anímico del momento, calmado con comida placentera (dulces o snacks). Tiende a preguntar qué puede comer en esos momentos.',
 'Comés de a poco muchas veces al día, creyendo que es hambre. Casi siempre es un estado anímico buscando alivio. La clave no es qué comer, sino identificar qué te pasa y qué otra cosa puede aliviarlo.',
 'No responder a la pregunta "¿qué puedo comer?" con una opción alimentaria. Redirigir siempre hacia la identificación del estado emocional y las alternativas no alimentarias. Esto es el núcleo del trabajo con este perfil.',
 ARRAY['Registro de episodios de picoteo con el estado anímico previo','Listado personal de actividades placenteras alternativas','Técnica de pausa y evaluación antes de comer','Diferenciación entre hambre real y displacer'],
 ARRAY['Picoteo continuo durante todo el día','Pregunta recurrente por opciones "permitidas"','Snacks dulces como recurso automático'],
 ARRAY['test_mes2_aburrimiento_y_comida','debq_2_comer_externo','tipo_hambre_predominante'], 7);