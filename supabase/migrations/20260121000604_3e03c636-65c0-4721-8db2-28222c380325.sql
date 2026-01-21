INSERT INTO form_templates (slug, title, description, schema_json, is_active, order_index)
VALUES (
  'evaluacion_inicial',
  'Evaluación inicial',
  'Conocerte mejor para personalizar tu acompañamiento',
  '{
    "version": 1,
    "sections": [{
      "title": "Sobre vos",
      "fields": [
        {
          "key": "objetivo_principal",
          "label": "¿Cuál es tu objetivo principal con este acompañamiento?",
          "type": "radio",
          "required": true,
          "options": [
            {"value": "bajar_peso", "label": "Bajar de peso"},
            {"value": "ordenar_alimentacion", "label": "Ordenar mi alimentación"},
            {"value": "reducir_ansiedad", "label": "Reducir ansiedad por comer"},
            {"value": "otro", "label": "Otro"}
          ]
        },
        {
          "key": "momentos_dificiles",
          "label": "¿En qué momentos del día te cuesta más controlarte con la comida?",
          "type": "checkbox",
          "required": false,
          "options": [
            {"value": "manana", "label": "Mañana"},
            {"value": "tarde", "label": "Tarde"},
            {"value": "noche", "label": "Noche"},
            {"value": "fines_semana", "label": "Fines de semana"}
          ]
        },
        {
          "key": "comentario_adicional",
          "label": "¿Hay algo más que quieras contarnos?",
          "type": "textarea",
          "required": false
        }
      ]
    }]
  }',
  true,
  0
);