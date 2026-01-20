-- Insertar template inicial: Clase 0.2 (Línea de base)
INSERT INTO public.form_templates (slug, title, description, order_index, is_active, schema_json)
VALUES (
  'baseline_0_2',
  'Tu punto de partida',
  'Una foto honesta para decidir mejor',
  1,
  true,
  '{
    "version": 1,
    "sections": [
      {
        "title": "Datos básicos",
        "description": "No es un examen. Es una foto honesta de cómo estás hoy para poder ayudarte mejor.",
        "fields": [
          { "key": "peso_hoy", "label": "¿Cuánto pesás hoy?", "helpText": "Anotá el peso actual, sin juzgarlo. Es solo un punto de partida.", "type": "number", "required": true },
          { "key": "cintura", "label": "Si lo sabés, ¿cuál es tu perímetro de cintura (cm)?", "helpText": "Si no lo conocés, dejalo en blanco.", "type": "number", "required": false },
          { "key": "altura", "label": "¿Cuánto medís (cm)?", "type": "number", "required": true },
          { "key": "medicacion", "label": "¿Tomás alguna medicación de forma habitual?", "helpText": "Si tomás, indicá cuál o cuáles.", "type": "textarea", "required": false }
        ]
      },
      {
        "title": "Cómo se organiza tu día",
        "fields": [
          { "key": "horarios_comidas", "label": "¿En qué horarios solés comer durante el día?", "helpText": "No lo ideal, sino lo que suele pasar en la práctica.", "type": "textarea", "required": true },
          { "key": "cantidad_comidas", "label": "En general, ¿cuántas comidas hacés por día?", "helpText": "Incluí picoteos si los hay.", "type": "text", "required": true },
          { "key": "sueno", "label": "¿A qué hora solés acostarte y levantarte?", "type": "text", "required": false }
        ]
      },
      {
        "title": "Hambre, ansiedad y desorden",
        "fields": [
          { "key": "momentos_hambre_ansiedad", "label": "¿En qué momentos del día sentís más hambre o ansiedad por comer?", "helpText": "Mañana, tarde, noche, fines de semana, situaciones puntuales.", "type": "textarea", "required": true },
          { "key": "situaciones_perder_control", "label": "¿En qué situaciones sentís que perdés más el control con la comida?", "helpText": "Por ejemplo: noche, estrés, salidas, cansancio, emociones.", "type": "textarea", "required": true }
        ]
      },
      {
        "title": "Movimiento",
        "fields": [
          { "key": "actividad", "label": "¿Hacés actualmente algún tipo de actividad física?", "helpText": "Contá cuál.", "type": "text", "required": false },
          { "key": "frecuencia", "label": "¿Cuántas veces por semana te movés, aunque sea poco?", "type": "text", "required": false },
          { "key": "duracion", "label": "En promedio, ¿cuánto dura cada sesión?", "type": "text", "required": false }
        ]
      },
      {
        "title": "Percepción personal",
        "fields": [
          { "key": "lo_que_cuesta", "label": "¿Qué es lo que hoy más te cuesta sostener en relación con la comida o el peso?", "type": "textarea", "required": true },
          { "key": "intentos_previos", "label": "¿Qué cosas ya intentaste antes y no lograste mantener en el tiempo?", "type": "textarea", "required": true },
          { "key": "deseo_3_meses", "label": "Si este acompañamiento funcionara bien, ¿qué te gustaría que fuera distinto dentro de tres meses?", "type": "textarea", "required": true }
        ]
      }
    ],
    "success": {
      "title": "¡Listo!",
      "message": "Gracias por completar esto. No es para juzgarte: es para ayudarte. En la próxima clase vamos a ordenar tu semana para que sea sostenible.",
      "primaryCtaLabel": "Volver a Evaluaciones",
      "primaryCtaTo": "/evaluaciones"
    }
  }'::jsonb
);