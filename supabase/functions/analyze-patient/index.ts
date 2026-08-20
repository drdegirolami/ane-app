import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Solo administradores' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const patientId = typeof body.patientId === 'string' ? body.patientId : '';
    if (!patientId) {
      return new Response(JSON.stringify({ error: 'patientId requerido' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Contexto del paciente
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, program_start_date, admin_notes')
      .eq('user_id', patientId)
      .maybeSingle();

    const { data: responses } = await supabase
      .from('form_responses')
      .select('answers_json, total_score, submitted_at, form_templates(title, slug)')
      .eq('patient_id', patientId)
      .order('submitted_at', { ascending: false })
      .limit(12);

    const { data: templates } = await supabase
      .from('form_templates')
      .select('slug, title, description')
      .eq('is_active', true)
      .order('title');

    const { data: profiles } = await supabase
      .from('clinical_profiles')
      .select('slug, name, description, clinical_attitude, behavioral_tasks, warning_signs')
      .eq('is_active', true);

    let month: number | null = null;
    if (profile?.program_start_date) {
      const start = new Date(profile.program_start_date);
      const diff = (Date.now() - start.getTime()) / (1000 * 60 * 60 * 24);
      month = Math.min(6, Math.max(1, Math.floor(diff / 30) + 1));
    }

    const prompt = `Sos un asistente clínico del programa ANE (tratamiento nutricional-conductual de obesidad, 6 meses).
Analizá el caso y devolvé conclusiones prácticas para el médico tratante. No hacés diagnóstico médico definitivo: sugerís hipótesis.

PACIENTE: ${profile?.full_name ?? 'sin nombre'}
MES DEL PROGRAMA: ${month ?? 'sin fecha de inicio'}
NOTAS PRIVADAS DEL MÉDICO: ${profile?.admin_notes ?? '(sin notas)'}

PERFILES CLÍNICOS DISPONIBLES:
${JSON.stringify(profiles ?? [], null, 1)}

RESPUESTAS DEL PACIENTE (más recientes primero):
${JSON.stringify(responses ?? [], null, 1)}

BIBLIOTECA DE TESTS Y FORMULARIOS DISPONIBLES:
${JSON.stringify(templates ?? [], null, 1)}

Respondé en español rioplatense.`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: 'Sos un asistente clínico conciso y concreto para un médico nutricionista.' },
          { role: 'user', content: prompt },
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'entregar_analisis',
              description: 'Devuelve el análisis clínico estructurado',
              parameters: {
                type: 'object',
                properties: {
                  resumen: { type: 'string', description: 'Resumen del estado actual del paciente, 3-5 oraciones' },
                  perfil_sugerido: { type: 'string', description: 'slug del perfil clínico dominante' },
                  perfil_secundario: { type: 'string', description: 'slug del perfil secundario o cadena vacía' },
                  hipotesis: { type: 'array', items: { type: 'string' }, description: 'Hipótesis clínicas tentativas' },
                  proximo_test: {
                    type: 'object',
                    properties: {
                      slug: { type: 'string' },
                      titulo: { type: 'string' },
                      motivo: { type: 'string' },
                    },
                    required: ['slug', 'titulo', 'motivo'],
                    additionalProperties: false,
                  },
                  senales_alerta: { type: 'array', items: { type: 'string' } },
                  sugerencias_consulta: { type: 'array', items: { type: 'string' }, description: 'Puntos a trabajar en la próxima consulta' },
                },
                required: ['resumen', 'perfil_sugerido', 'hipotesis', 'proximo_test', 'senales_alerta', 'sugerencias_consulta'],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: 'function', function: { name: 'entregar_analisis' } },
      }),
    });

    if (aiResponse.status === 429) {
      return new Response(JSON.stringify({ error: 'Límite de uso de IA alcanzado, probá de nuevo en un momento.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (aiResponse.status === 402) {
      return new Response(JSON.stringify({ error: 'Sin créditos de IA disponibles.' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error('AI gateway error', aiResponse.status, text);
      return new Response(JSON.stringify({ error: 'Error del servicio de IA' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const call = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    const analysis = call?.function?.arguments ? JSON.parse(call.function.arguments) : null;

    if (!analysis) {
      return new Response(JSON.stringify({ error: 'La IA no devolvió un análisis válido' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('analyze-patient error', err);
    return new Response(JSON.stringify({ error: 'Error inesperado' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
