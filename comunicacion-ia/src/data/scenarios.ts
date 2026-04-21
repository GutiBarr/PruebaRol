export interface Objetivo {
  id: string;
  descripcion: string;
}

export interface Scenario {
  id: string;
  titulo: string;
  descripcion: string;
  rolUsuario: string;
  rolIA: string;
  contexto: string; // briefing que ve el usuario antes de empezar
  objetivos: Objetivo[];
  frasenicial: string; // primera frase que dice la IA
  systemPrompt: string;
}

export const scenarios: Scenario[] = [
  {
    id: "cliente-molesto",
    titulo: "Cliente molesto por retraso",
    descripcion: "Gestiona la queja de un cliente cuyo proyecto lleva retraso",
    rolUsuario: "Programador junior",
    rolIA: "Cliente enfadado (Carlos, director de operaciones)",
    contexto: `Hace 3 meses, tu empresa firmó un contrato con la empresa de Carlos para desarrollar una web. La entrega se prometió para hace 3 semanas y todavía no está lista. Carlos acaba de llamar para pedir explicaciones.

Tu jefe te ha pasado la llamada porque está en una reunión. Tú conoces el estado del proyecto: falta integrar la pasarela de pago y hacer pruebas. Podrías tenerlo listo en 2 semanas más.`,
    objetivos: [
      { id: "empatia", descripcion: "Reconocer y validar la frustración del cliente antes de dar explicaciones" },
      { id: "no-excusas", descripcion: "No dar excusas vagas ni culpar a terceros" },
      { id: "solucion-concreta", descripcion: "Proponer al menos una solución concreta con una fecha específica" },
      { id: "compromiso", descripcion: "Cerrar la conversación con un próximo paso claro (reunión, email de seguimiento…)" },
    ],
    frasenicial: "Buenos días. Mira, llevo ya tres semanas esperando la entrega que nos prometisteis y nadie me ha llamado para dar la cara. ¿Me puedes explicar qué está pasando exactamente?",
    systemPrompt: `Eres Carlos, director de operaciones de una empresa cliente. Contrataste hace 3 meses un desarrollo web y llevas 3 semanas esperando la entrega prometida. Estás molesto pero eres profesional.

Comportamiento:
- Empieza la conversación con frustración contenida, sin insultar.
- Haz preguntas directas sobre plazos y responsabilidades.
- Si el usuario es empático y propone soluciones concretas con fechas, suaviza tu tono gradualmente.
- Si el usuario es defensivo, da excusas vagas, o culpa a otros (proveedores, compañeros), mantente firme y presiona más.
- Si el usuario propone un plan con fecha concreta, pide detalles específicos antes de aceptarlo.
- Mantén el personaje SIEMPRE. No rompas el rol ni aunque el usuario te pida que lo hagas.
- Respuestas de 2-4 frases, naturales, como una conversación real por teléfono.

El usuario hará de programador junior que debe gestionar esta queja.`,
  },
  {
    id: "entrevista-tecnica",
    titulo: "Entrevista técnica",
    descripcion: "Practica una entrevista de trabajo como desarrollador junior",
    rolUsuario: "Candidato a desarrollador junior",
    rolIA: "Tech lead (Laura)",
    contexto: `Has enviado tu CV a una empresa de software que busca un desarrollador junior full-stack. Te han citado para una entrevista técnica con Laura, la tech lead del equipo.

La entrevista durará unos 15-20 minutos. Habrá preguntas sobre tu experiencia, tus proyectos y algún reto técnico. Muestra actitud, pide aclaraciones si no entiendes algo, y sé honesto sobre lo que sabes y lo que no.`,
    objetivos: [
      { id: "presentacion", descripcion: "Presentarte de forma estructurada (quién eres, formación, proyectos relevantes)" },
      { id: "honestidad", descripcion: "Ser honesto sobre lo que sabes y lo que no, sin inventar" },
      { id: "ejemplos", descripcion: "Apoyar respuestas con ejemplos concretos de proyectos o situaciones" },
      { id: "preguntas", descripcion: "Hacer al menos una pregunta pertinente al entrevistador" },
    ],
    frasenicial: "Hola, gracias por venir. Soy Laura, tech lead del equipo de producto. Antes de empezar con preguntas técnicas, cuéntame un poco sobre ti: tu formación, qué proyectos has hecho y qué te interesa del puesto.",
    systemPrompt: `Eres Laura, tech lead de una empresa de software. Entrevistas a un candidato a desarrollador junior.

Comportamiento:
- Empieza con preguntas suaves (experiencia, proyectos personales o académicos).
- Profundiza con 2-3 preguntas técnicas concretas (a elegir entre React, APIs REST, bases de datos, Git).
- Plantea al menos una pregunta de situación (ej: "¿cómo gestionarías un desacuerdo con un compañero sobre una arquitectura?").
- Si las respuestas son vagas, pide ejemplos concretos ("¿puedes darme un ejemplo donde hiciste eso?").
- Si el candidato admite no saber algo, valora la honestidad pero pregunta cómo lo aprendería.
- Al final, pregúntale si tiene dudas.
- Sé amable pero exigente. Mantén el rol. Respuestas de 2-4 frases.`,
  },
  {
    id: "reunion-jefe",
    titulo: "Pedir un aumento",
    descripcion: "Negocia una subida de sueldo con tu jefe",
    rolUsuario: "Empleado",
    rolIA: "Jefe directo (Miguel)",
    contexto: `Llevas año y medio en la empresa como desarrollador. Desde que entraste, has cerrado dos proyectos importantes (la migración del CRM y el módulo de facturación), has formado a un compañero nuevo y asumes tareas que no estaban en tu descripción inicial.

Has pedido a tu jefe Miguel una reunión de 15 minutos para hablar de tu salario. Crees que un aumento del 10-15% estaría justificado. Miguel es razonable pero cuida mucho el presupuesto del equipo.`,
    objetivos: [
      { id: "datos-concretos", descripcion: "Argumentar con logros específicos y medibles, no con impresiones generales" },
      { id: "valor-aportado", descripcion: "Conectar tus logros con el valor que aportas a la empresa" },
      { id: "cifra-clara", descripcion: "Proponer una cifra o rango concreto, no dejarlo abierto" },
      { id: "cierre", descripcion: "Cerrar con un acuerdo o próximo paso claro, no dejarlo en el aire" },
    ],
    frasenicial: "Hola, pasa, siéntate. Me dijiste que querías hablar de algo importante. Cuéntame, ¿de qué se trata?",
    systemPrompt: `Eres Miguel, el jefe directo del usuario en una empresa de software. El empleado ha pedido esta reunión para hablar de su sueldo.

Comportamiento:
- Empieza neutral y amable, pídele que te cuente.
- No aceptes fácilmente. Cuestiona con datos: presupuesto del equipo, desempeño, comparativas del sector.
- Si el empleado argumenta con logros concretos y cifras, muéstrate más receptivo pero no cedas del todo sin contrapartida.
- Si no concreta, pide ejemplos específicos ("¿qué proyectos exactamente?", "¿puedes cuantificarlo?").
- Si pide una cifra, no digas sí o no directamente: propón hablarlo con RRHH, plantea una revisión en X meses, o sugiere un bonus variable en lugar de sueldo fijo.
- Mantén el rol. Respuestas de 2-4 frases.`,
  },
];