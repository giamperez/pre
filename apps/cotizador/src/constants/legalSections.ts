import type { CustomFieldDefinition } from '../components/company/CompanyCustomFieldsEditor';

export interface LegalSection {
  title: string;
  content: string;
  enabled: boolean;
  fields?: CustomFieldDefinition[];
}

const VERTEX_SECTIONS: LegalSection[] = [
  {
    title: "Alcance del Servicio",
    content: "El presente servicio comprende el desarrollo e implementación de las funcionalidades descritas en esta cotización, conforme a los requerimientos previamente definidos y aprobados por el cliente.\n\nCualquier modificación al alcance o incorporación de nuevas funcionalidades será evaluada y cotizada por separado.\n\nLa presente cotización comprende únicamente los entregables descritos en este documento. Cualquier componente o activo técnico no contemplado expresamente en la sección «Entrega de Productos Finales» se entenderá excluido del alcance de la presente propuesta, salvo acuerdo escrito entre las partes.",
    enabled: false
  },
  {
    title: "Condiciones para la realización del Servicio",
    content: "El cliente deberá proporcionar oportunamente toda la información necesaria para el desarrollo del proyecto, incluyendo textos, imágenes, logotipos, manual de identidad visual, catálogos de productos y demás recursos requeridos.\n\nEn caso de requerirse acceso a servicios de terceros (hosting, dominio, pasarelas de pago, correos corporativos, APIs, entre otros), el cliente deberá proporcionar las credenciales correspondientes.\n\nLos retrasos ocasionados por la entrega tardía de información, aprobaciones o accesos podrán modificar el cronograma de ejecución sin generar responsabilidad para Vertex Developers.",
    enabled: false
  },
  {
    title: "Responsabilidades del Cliente",
    content: "• Proporcionar oportunamente la información y recursos necesarios.\n- Aprobar los requerimientos funcionales antes del inicio del desarrollo.",
    enabled: false
  },
  {
    title: "Plazos de Ejecución",
    content: "El tiempo estimado para el desarrollo del proyecto es de 45 días calendario, distribuidos de la siguiente manera:\n\n- Análisis y levantamiento de requerimientos: 5 días calendario.\n- Diseño de interfaces (UI/UX): 5 días calendario.\n- Desarrollo de la aplicación: 30 días calendario.\n- Pruebas, ajustes e implementación: 5 días calendario.\n\n*El plazo es referencial a aceptación de servicios de terceros: Pasarelas de pago, APIs externas.",
    enabled: false
  },
  {
    title: "Pruebas y Aceptación",
    content: "Antes de la entrega final se realizarán pruebas funcionales para verificar el correcto funcionamiento de las funcionalidades incluidas en el alcance.\n\nEl cliente dispondrá de un período de revisión de hasta 5 días calendario para reportar observaciones relacionadas con el alcance contratado.\n\nLas observaciones que impliquen nuevas funcionalidades serán consideradas como requerimientos adicionales y serán cotizadas por separado.",
    enabled: false
  },
  {
    title: "Forma de Pago",
    content: "• 40% del monto total al aceptar la cotización, como adelanto para el inicio del proyecto.\n- 30% al aprobar la maqueta funcional (frontend), una vez validado el diseño, la estructura y la experiencia de usuario.\n- 30% restante al concluir el desarrollo, luego de la demostración de las funcionalidades del sistema mediante una reunión virtual y la conformidad del cliente.\n\nLos entregables del proyecto serán entregados una vez confirmado el pago del 100% del monto contratado.\n\nEn caso de retraso en cualquiera de los pagos establecidos, Vertex Developers podrá suspender temporalmente las actividades del proyecto hasta la regularización de los importes pendientes.",
    enabled: false
  },
  {
    title: "Validez de la Cotización",
    content: "La presente cotización tiene una vigencia de 15 días calendario contados desde su fecha de emisión.\n\nLa presente cotización incluye IGV.",
    enabled: false
  },
  {
    title: "Garantía del Servicio",
    content: "Vertex Developers brinda una garantía de 60 días calendario contados a partir de la entrega del proyecto.\n\nLa garantía cubre exclusivamente la corrección de errores de programación relacionados con las funcionalidades incluidas en el alcance aprobado.\n\nLa garantía no incluye:\n- Nuevas funcionalidades.\n- Cambios en los procesos del negocio.\n- Modificaciones solicitadas después de la aprobación del proyecto.\n- Problemas ocasionados por terceros.\n- Fallas derivadas de modificaciones realizadas por personas ajenas a Vertex Developers.\n- Problemas ocasionados por el servidor, hosting, proveedores de Internet o servicios externos.",
    enabled: false
  },
  {
    title: "Licencia de Uso del software",
    content: "Con la entrega del proyecto y una vez efectuado el pago total del servicio, el cliente adquiere una licencia de uso sobre la solución desarrollada, que le permite utilizarla para las actividades propias de su organización conforme al alcance contratado.\n\nLos componentes tecnológicos, librerías, frameworks, plantillas, arquitecturas, metodologías, herramientas internas y demás elementos desarrollados previamente o reutilizables por Vertex Developers continúan siendo de su titularidad, pudiendo ser utilizados en otros proyectos sin afectar los derechos de uso otorgados al cliente.\n\nLa entrega del código fuente únicamente se realizará cuando haya sido expresamente incluida en la presente cotización o acordada posteriormente por escrito entre ambas partes.",
    enabled: false
  },
  {
    title: "Entrega de Productos Finales",
    content: "Al finalizar el proyecto se entregará:\n\n- Aplicación web completamente funcional e implementada.\n- Respaldo de la base de datos (cuando corresponda).\n- Manual de usuario.\n- Documentación funcional incluida en la presente cotización (si aplica).\n- Credenciales de acceso a los servicios contratados por el cliente (cuando corresponda).\n- Capacitación para el personal designado.\n- Acta de conformidad del servicio.\n\nTodos los entregables serán proporcionados en formato digital mediante archivos electrónicos o mediante acceso a la infraestructura del cliente, según corresponda.",
    enabled: false
  }
];

// Mismo contenido que "seccionesEstandarIngenieria" en apps/api/prisma/seed.ts,
// para que la base "en blanco" de Pyramid ya venga con lenguaje de ingeniería
// y no con el de desarrollo de software de Vertex.
const PYRAMID_SECTIONS: LegalSection[] = [
  {
    title: "Alcance del Servicio",
    content: "La presente cotización comprende únicamente los servicios detallados en la especialidad de estructuras, según los ítems descritos.\n\nLos entregables incluyen la entrega digital, según corresponda:\n- Archivos de cálculo\n- Modelos BIM\n- Planos de la especialidad\n- Memorias de cálculo\n- Memoria descriptiva\n- Especificaciones técnicas\n- Metrados\n\nCualquier requerimiento adicional deberá ser evaluado y presupuestado por separado.",
    enabled: false
  },
  {
    title: "Normativa Aplicable",
    content: "El desarrollo del proyecto se realizará conforme a la normativa vigente nacional e internacional aplicable, incluyendo:\n- Reglamento Nacional de Edificaciones (RNE)\n- ACI 318, ASCE/SEI, ISO19650, entre otras.",
    enabled: false
  },
  {
    title: "Metodología de trabajo",
    content: "El servicio se desarrollará bajo criterios técnicos, normativos y de buenas prácticas de ingeniería.\n- Se empleará metodología BIM para modelado, coordinación y documentación\n- Se realizará compatibilización entre especialidades\n- Se efectuarán reuniones de coordinación con el cliente\n- Se entregarán avances parciales para revisión y validación",
    enabled: false
  },
  {
    title: "Responsabilidades del Cliente",
    content: "El cliente se compromete a:\n- Proporcionar planos base (arquitectura, topografía, etc.)\n- Facilitar estudios básicos (mecánica de suelos, estudios previos, etc.)\n- Gestionar permisos, licencias y autorizaciones necesarias\n- Brindar acceso al proyecto para visitas de campo de ser necesario\n- Revisar y aprobar oportunamente los entregables",
    enabled: false
  },
  {
    title: "Plazos de Ejecución",
    content: "El tiempo de realización del servicio es de aproximadamente:\nVisita de campo: 02 días calendario (En caso se requiera)\nDesarrollo de la especialidad: 60 días calendario\n\nLos plazos pueden verse afectados por falta de coordinación con el cliente o por incompatibilidades con otras especialidades.",
    enabled: false
  },
  {
    title: "Forma de Pago",
    content: "Se requerirá un adelanto del 50% del monto total para el inicio de actividades.\nSe cancelará el 30% a la aprobación de los planos en planta y el 20% restante antes del alcance del entregable final.\n\nEn caso de retrasos en los pagos, la entrega de informes y planos podrá verse afectada.",
    enabled: false
  },
  {
    title: "Validez de la Cotización",
    content: "La presente cotización tiene una validez de 15 días a partir de la fecha de emisión.\nLa presente cotización incluye IGV.\nCualquier modificación en los alcances del servicio o variaciones en los entregables podrá generar ajustes en el presupuesto.",
    enabled: false
  },
  {
    title: "Garantía del Servicio",
    content: "Se garantiza que el diseño será desarrollado conforme a la normativa vigente y criterios técnicos de ingeniería.\nEl cliente es el responsable de la construcción o ejecución de la propuesta de intervención.",
    enabled: false
  },
  {
    title: "Entrega de Productos Finales",
    content: "Los entregables incluirán planos, memorias, especificaciones, costos, según lo indicado en la cotización.\nLos documentos se entregarán en formato digital (PDF, DOC, XLS, DWG, según corresponda).",
    enabled: false
  },
  {
    title: "Exclusiones del Servicio",
    content: "Salvo indicación expresa, no se incluyen:\n- Supervisión de obra\n- Gestión de permisos o licencias\n- Estudios especializados (geotecnia, impacto ambiental, etc.)\n- Pruebas, ensayos o certificaciones en campo\n- Diseño de especialidades no contempladas en el alcance",
    enabled: false
  }
];

const SECTIONS_BY_COMPANY: Record<string, LegalSection[]> = {
  'vertex-developers': VERTEX_SECTIONS,
  'pyramid-structures': PYRAMID_SECTIONS,
};

export function getDefaultSections(companySlug?: string | null): LegalSection[] {
  const list = (companySlug && SECTIONS_BY_COMPANY[companySlug]) || VERTEX_SECTIONS;
  return list.map((s) => ({ ...s, enabled: true }));
}
