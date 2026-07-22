import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  let companiesCount = 0;
  let catalogItemsCount = 0;

  // ---------------------------------------------------------
  // EMPRESA 1: Vertex Developers
  // ---------------------------------------------------------
  const vertex = await prisma.company.upsert({
    where: { slug: 'vertex-developers' },
    update: {
      name: 'Vertex Developers',
      logoUrl: '/companies/vertex-developers/logo.png',
      colorPrimary: '#0C2448',
      colorSecondary: '#0397A3',
      coverImageUrl: '/companies/vertex-developers/portada.jpeg',
      backCoverImageUrl: '/companies/vertex-developers/contraportada.jpeg',
      contactPhone: '987 970 396',
      contactEmail: 'contacto@vertexdev.tech',
      paymentInfo: JSON.stringify({
        banco: 'BCP',
        cuenta: '245-7405943-0-50',
        cci: '002-245-007405943050-99',
      }),
    },
    create: {
      name: 'Vertex Developers',
      slug: 'vertex-developers',
      logoUrl: '/companies/vertex-developers/logo.png',
      colorPrimary: '#0C2448',
      colorSecondary: '#0397A3',
      coverImageUrl: '/companies/vertex-developers/portada.jpeg',
      backCoverImageUrl: '/companies/vertex-developers/contraportada.jpeg',
      contactPhone: '987 970 396',
      contactEmail: 'contacto@vertexdev.tech',
      paymentInfo: JSON.stringify({
        banco: 'BCP',
        cuenta: '245-7405943-0-50',
        cci: '002-245-007405943050-99',
      }),
    },
  });
  companiesCount++;

  const vertexServices = [
    // web
    { name: 'Landing page / Sitio corporativo simple', description: 'Página informativa de 1 a 5 secciones, diseño responsive.', basePrice: 1500, category: 'web', isAddon: false },
    { name: 'Página web con catálogo', description: 'Web con catálogo de productos/servicios y pedidos vía WhatsApp.', basePrice: 3000, category: 'web', isAddon: false },
    { name: 'E-commerce / Tienda online', description: 'Plataforma con tienda online, carrito, pagos y panel administrativo.', basePrice: 9500, category: 'web', isAddon: false },
    { name: 'Software / SaaS a medida', description: 'Aplicación web personalizada con módulos según requerimiento.', basePrice: 8000, category: 'web', isAddon: false },
    { name: 'App móvil (Android / iOS)', description: 'Aplicación móvil nativa o híbrida.', basePrice: 12000, category: 'web', isAddon: false },
    // addon
    { name: 'Integración de pagos (Yape / tarjeta)', description: 'Configuración de pasarela de pagos.', basePrice: 800, category: 'addon', isAddon: true },
    { name: 'Facturación electrónica (Boletas/Facturas)', description: 'Integración con OSE/PSE para emisión electrónica.', basePrice: 700, category: 'addon', isAddon: true },
    { name: 'Adaptación PWA (app instalable)', description: 'Convierte la web en app instalable desde el navegador.', basePrice: 1000, category: 'addon', isAddon: true },
    { name: 'Chatbot con IA', description: 'Bot entrenado para atención y sugerencias automáticas.', basePrice: 800, category: 'addon', isAddon: true },
    { name: 'Configuración Google Analytics', description: 'Panel de métricas y seguimiento de visitas.', basePrice: 200, category: 'addon', isAddon: true },
    { name: 'Correos corporativos (2 cuentas)', description: 'Cuentas de correo con dominio propio.', basePrice: 150, category: 'addon', isAddon: true },
    { name: 'Dominio y hosting (1 año)', description: 'Registro de dominio y alojamiento por un año.', basePrice: 200, category: 'addon', isAddon: true },
    { name: 'Integración WhatsApp Business', description: 'Chatbot básico de atención por WhatsApp.', basePrice: 500, category: 'addon', isAddon: true },
    { name: 'SEO on-page', description: 'Optimización técnica para motores de búsqueda.', basePrice: 300, category: 'addon', isAddon: true },
    { name: 'Seguimiento de pedidos (API transporte)', description: 'Integración con API de transportista (ej. Shalom).', basePrice: 600, category: 'addon', isAddon: true },
  ];

  for (const item of vertexServices) {
    await prisma.serviceCatalogItem.upsert({
      where: {
        companyId_name: {
          companyId: vertex.id,
          name: item.name,
        },
      },
      update: {
        description: item.description,
        basePrice: item.basePrice,
        category: item.category,
        isAddon: item.isAddon,
        currency: 'PEN',
      },
      create: {
        companyId: vertex.id,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        category: item.category,
        isAddon: item.isAddon,
        currency: 'PEN',
      },
    });
    catalogItemsCount++;
  }

  // ---------------------------------------------------------
  // EMPRESA 2: Pyramid Structures
  // ---------------------------------------------------------
  const pyramid = await prisma.company.upsert({
    where: { slug: 'pyramid-structures' },
    update: {
      name: 'Pyramid Structures EIRL',
      logoUrl: '/companies/pyramid-structures/logo.png',
      colorPrimary: '#1A6B8A',
      colorSecondary: '#E8A020',
      coverImageUrl: '/companies/pyramid-structures/portada.jpeg',
      backCoverImageUrl: '/companies/pyramid-structures/contraportada.jpeg',
      contactPhone: '+51 913 333 660',
      contactEmail: 'proyectos@pyramid.com.pe',
      paymentInfo: JSON.stringify({
        banco: 'BCP',
        cuenta: '245-9881481-0-84',
        cci: '00224500988148108496',
        bancoNacion: '00761262890',
        detraccion: 'N° de detracciones: (por definir)',
        ruc: '20609532646',
        direccion: 'Romero 389, Cajamarca 06002, Perú',
        web: 'www.pyramid.com.pe'
      }),
    },
    create: {
      name: 'Pyramid Structures EIRL',
      slug: 'pyramid-structures',
      logoUrl: '/companies/pyramid-structures/logo.png',
      colorPrimary: '#1A6B8A',
      colorSecondary: '#E8A020',
      coverImageUrl: '/companies/pyramid-structures/portada.jpeg',
      backCoverImageUrl: '/companies/pyramid-structures/contraportada.jpeg',
      contactPhone: '+51 913 333 660',
      contactEmail: 'proyectos@pyramid.com.pe',
      paymentInfo: JSON.stringify({
        banco: 'BCP',
        cuenta: '245-9881481-0-84',
        cci: '00224500988148108496',
        bancoNacion: '00761262890',
        detraccion: 'N° de detracciones: (por definir)',
        ruc: '20609532646',
        direccion: 'Romero 389, Cajamarca 06002, Perú',
        web: 'www.pyramid.com.pe'
      }),
    },
  });
  companiesCount++;

  const pyramidServices = [
    // diseño-estructural
    { name: 'Expediente técnico — Estructuras (edificio hasta 3 pisos)', description: 'Diseño estructural completo: superestructura, cimentaciones, componentes especiales, planos, memoria de cálculo, memoria descriptiva, EETT, metrados y presupuesto.', basePrice: 2800, category: 'diseño-estructural', isAddon: false },
    { name: 'Expediente técnico — Estructuras metálicas / Nave industrial', description: 'Diseño de estructuras metálicas: cobertura, columnas, arriostres, conexiones, cimentaciones, planos de fabricación y montaje.', basePrice: 6900, category: 'diseño-estructural', isAddon: false },
    { name: 'Revisión de diseño estructural existente', description: 'Revisión y actualización de planos: superestructura, cimentaciones, componentes especiales, memoria de cálculo, EETT, metrados y presupuesto.', basePrice: 4050, category: 'diseño-estructural', isAddon: false },
    { name: 'Costos y presupuestos de obra', description: 'Elaboración de metrados, presupuesto de obra por especialidades, APU, fórmula polinómica, cronograma valorizado y curva S.', basePrice: 2750, category: 'diseño-estructural', isAddon: false },
    // inspeccion-evaluacion
    { name: 'Inspección estructural + Evaluación + Propuesta de reforzamiento (alcance completo)', description: 'Levantamiento estructural, ensayos NDT (esclerometría, pacometría), ensayos destructivos (testigos), EMS (3 calicatas), modelamiento, informe y propuesta de intervención.', basePrice: 28500, category: 'inspeccion-evaluacion', isAddon: false },
    { name: 'Inspección + Evaluación básica + Propuesta de reforzamiento (local comercial)', description: 'Inspección visual, ensayos NDT básicos, evaluación simplificada de cimentaciones y propuesta de reforzamiento.', basePrice: 3000, category: 'inspeccion-evaluacion', isAddon: false },
    // construccion
    { name: 'Construcción / Ejecución de obra (por alcance)', description: 'Ejecución de obra con metodología BIM. Incluye mano de obra, materiales, seguridad y supervisión. Precio referencial por m².', basePrice: 102350, category: 'construccion', isAddon: false },
    // addon-estructural
    { name: 'Estudio de mecánica de suelos (3 calicatas)', description: 'EMS con perfil de suelo, capacidad portante y parámetros geotécnicos.', basePrice: 4500, category: 'addon-estructural', isAddon: true },
    { name: 'Ensayos de esclerometría (Martillo de Schmidt)', description: 'Estimación de resistencia superficial del concreto.', basePrice: 1500, category: 'addon-estructural', isAddon: true },
    { name: 'Extracción de testigos de concreto (lab.)', description: 'Ensayo destructivo ASTM C42 para determinar resistencia a compresión.', basePrice: 3000, category: 'addon-estructural', isAddon: true },
    { name: 'Levantamiento con estación total', description: 'Levantamiento geométrico a detalle de la estructura existente.', basePrice: 2000, category: 'addon-estructural', isAddon: true },
    { name: 'Planos As-Built', description: 'Planos del estado actual de la estructura conforme a obra.', basePrice: 1500, category: 'addon-estructural', isAddon: true },
    { name: 'Cronograma de ejecución de obra', description: 'Cronograma de adquisición de materiales y avance valorizado.', basePrice: 750, category: 'addon-estructural', isAddon: true },
  ];

  for (const item of pyramidServices) {
    await prisma.serviceCatalogItem.upsert({
      where: {
        companyId_name: {
          companyId: pyramid.id,
          name: item.name,
        },
      },
      update: {
        description: item.description,
        basePrice: item.basePrice,
        category: item.category,
        isAddon: item.isAddon,
        currency: 'PEN',
      },
      create: {
        companyId: pyramid.id,
        name: item.name,
        description: item.description,
        basePrice: item.basePrice,
        category: item.category,
        isAddon: item.isAddon,
        currency: 'PEN',
      },
    });
    catalogItemsCount++;
  }

  // --- SEED DE PLANTILLAS PYRAMID STRUCTURES ---
  const seccionesEstandarIngenieria = [
    { title: "Alcance del Servicio", content: "La presente cotización comprende únicamente los servicios detallados en la especialidad de estructuras, según los ítems descritos.\n\nLos entregables incluyen la entrega digital, según corresponda:\n- Archivos de cálculo\n- Modelos BIM\n- Planos de la especialidad\n- Memorias de cálculo\n- Memoria descriptiva\n- Especificaciones técnicas\n- Metrados\n\nCualquier requerimiento adicional deberá ser evaluado y presupuestado por separado.", enabled: true },
    { title: "Normativa Aplicable", content: "El desarrollo del proyecto se realizará conforme a la normativa vigente nacional e internacional aplicable, incluyendo:\n- Reglamento Nacional de Edificaciones (RNE)\n- ACI 318, ASCE/SEI, ISO19650, entre otras.", enabled: true },
    { title: "Metodología de trabajo", content: "El servicio se desarrollará bajo criterios técnicos, normativos y de buenas prácticas de ingeniería.\n- Se empleará metodología BIM para modelado, coordinación y documentación\n- Se realizará compatibilización entre especialidades\n- Se efectuarán reuniones de coordinación con el cliente\n- Se entregarán avances parciales para revisión y validación", enabled: true },
    { title: "Responsabilidades del Cliente", content: "El cliente se compromete a:\n- Proporcionar planos base (arquitectura, topografía, etc.)\n- Facilitar estudios básicos (mecánica de suelos, estudios previos, etc.)\n- Gestionar permisos, licencias y autorizaciones necesarias\n- Brindar acceso al proyecto para visitas de campo de ser necesario\n- Revisar y aprobar oportunamente los entregables", enabled: true },
    { title: "Plazos de Ejecución", content: "El tiempo de realización del servicio es de aproximadamente:\nVisita de campo: 02 días calendario (En caso se requiera)\nDesarrollo de la especialidad: 60 días calendario\n\nLos plazos pueden verse afectados por falta de coordinación con el cliente o por incompatibilidades con otras especialidades.", enabled: true },
    { title: "Forma de Pago", content: "Se requerirá un adelanto del 50% del monto total para el inicio de actividades.\nSe cancelará el 30% a la aprobación de los planos en planta y el 20% restante antes del alcance del entregable final.\n\nEn caso de retrasos en los pagos, la entrega de informes y planos podrá verse afectada.", enabled: true },
    { title: "Validez de la Cotización", content: "La presente cotización tiene una validez de 15 días a partir de la fecha de emisión.\nLa presente cotización incluye IGV.\nCualquier modificación en los alcances del servicio o variaciones en los entregables podrá generar ajustes en el presupuesto.", enabled: true },
    { title: "Garantía del Servicio", content: "Se garantiza que el diseño será desarrollado conforme a la normativa vigente y criterios técnicos de ingeniería.\nEl cliente es el responsable de la construcción o ejecución de la propuesta de intervención.", enabled: true },
    { title: "Entrega de Productos Finales", content: "Los entregables incluirán planos, memorias, especificaciones, costos, según lo indicado en la cotización.\nLos documentos se entregarán en formato digital (PDF, DOC, XLS, DWG, según corresponda).", enabled: true },
    { title: "Exclusiones del Servicio", content: "Salvo indicación expresa, no se incluyen:\n- Supervisión de obra\n- Gestión de permisos o licencias\n- Estudios especializados (geotecnia, impacto ambiental, etc.)\n- Pruebas, ensayos o certificaciones en campo\n- Diseño de especialidades no contempladas en el alcance", enabled: true }
  ];

  const templatesPyramid = [
    // ─── COT-TIP-ED ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-ED",
      name: "Expediente técnico — Estructuras (edificio)",
      category: "diseño-estructural",
      projectData: { nombre: "Desarrollo de especialidades — Estructuras", modalidad: "Proyecto por alcance", plazo: "60 días calendario" },
      items: [
        { detalle: "DISEÑO DE LA SUPERESTRUCTURA\nEstructuración y Predimensionamiento\nModelamiento Estructural Completo del Edificio\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nAnálisis normativo por Viento\nRevisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de los Elementos Estructurales", cantidad: 1, precioUnitario: 500, total: 500 },
        { detalle: "DISEÑO DE COMPONENTES ESPECIALES\nDiseño de conexiones\nElementos de la fachada", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "DISEÑO DE CIMENTACIONES\nEstructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Deslizamiento y Volteo\nDiseño de Concreto Armado", cantidad: 1, precioUnitario: 300, total: 300 },
        { detalle: "DIBUJO DE PLANOS\nPlanos en Planta\nPlanos de Elevaciones\nPlanos de Detalles Estructurales", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "MEMORIA DE CÁLCULO\nDiseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "MEMORIA DESCRIPTIVA\nCriterios de diseño y normativas aplicadas\nConsideraciones técnicas de la superestructura, componentes especiales y cimentaciones\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "ESPECIFICACIONES TÉCNICAS\nCaracterísticas de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "METRADOS\nMetrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "COSTOS Y PRESUPUESTOS\nAnálisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S (avance físico y financiero)\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
      ],
      sections: seccionesEstandarIngenieria
    },
    // ─── COT-TIP-RV ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-RV",
      name: "Revisión de diseño estructural",
      category: "diseño-estructural",
      projectData: { nombre: "Actualización de planos de estructuras", modalidad: "Proyecto por alcance", plazo: "45 días calendario" },
      items: [
        { detalle: "REVISIÓN DE LA SUPERESTRUCTURA\nEstructuración y Predimensionamiento\nModelamiento Estructural Completo del Edificio\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático normativo, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nRevisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de Vigas\nDiseño de Columnas\nDiseño de Muros\nDiseño de Losas", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { detalle: "REVISIÓN DE COMPONENTES ESPECIALES\nDiseño estructural de escalera\nElementos asociados a ascensores (cuando aplique)", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "REVISIÓN DE CIMENTACIONES\nEstructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Punzonamiento\nDiseño del Refuerzo en las cimentaciones de Columnas\nDiseño de Elementos de Conexión (Vigas)", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "REVISIÓN Y MODIFICACIÓN DE PLANOS\nPlanos Generales en planta\nPlanos de Cimentaciones\nPlanos de Columnas y Muros\nPlanos de Losas y Vigas\nPlanos de Cortes Estructurales\nPlanos de Conexiones\nPlanos de Detalles Estructurales", cantidad: 1, precioUnitario: 800, total: 800 },
        { detalle: "MEMORIA DESCRIPTIVA\nCriterios de diseño y normativas aplicadas\nConsideraciones técnicas de la superestructura, componentes especiales y cimentaciones\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 350, total: 350 },
        { detalle: "MEMORIA DE CÁLCULO\nDiseño de las Cimentaciones\nDiseño de la Superestructura\nDiseño de los Componentes Especiales", cantidad: 1, precioUnitario: 350, total: 350 },
        { detalle: "ESPECIFICACIONES TÉCNICAS\nCaracterísticas de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "METRADOS\nMetrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 350, total: 350 },
        { detalle: "COSTOS Y PRESUPUESTOS\nAnálisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
      ],
      sections: seccionesEstandarIngenieria
    },
    // ─── COT-TIP-IN ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-IN",
      name: "Estructuras metálicas / Nave industrial",
      category: "diseño-estructural",
      projectData: { nombre: "Diseño de estructura metálica", modalidad: "Proyecto por alcance", plazo: "60 días calendario" },
      items: [
        { detalle: "DISEÑO DE LA SUPERESTRUCTURA\nEstructuración y Predimensionamiento\nModelamiento Estructural Completo de la Cobertura\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático normativo, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nAnálisis normativo por Viento\nAnálisis normativo por cambios de Temperatura\nRevisión de Desplazamientos y Distorsiones\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de Vigas\nDiseño de Columnas\nDiseño de Pedestales\nDiseño de Arriostres o Tensores", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { detalle: "DISEÑO DE COMPONENTES ESPECIALES\nConexiones de Placa base\nConexiones de Viga - columna\nConexiones de Arriostres\nConexiones a Otros Elementos\nDiseño de Pernos\nDiseño de Soportes para Canaletas\nDiseño de Soldadura", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { detalle: "DISEÑO DE CIMENTACIONES\nEstructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Punzonamiento\nDiseño del Refuerzo en las cimentaciones de Columnas\nDiseño de Elementos de Conexión (Vigas)", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { detalle: "DIBUJO DE PLANOS\nPlanos de Cimentaciones\nPlanos Generales en planta\nPlanos de Ejes\nPlanos de Cortes Estructurales\nPlanos de Conexiones\nPlanos de Detalles Estructurales\nPlanos de Componentes Especiales\nPlanos de Fabricación\nPlanos de Montaje", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { detalle: "MEMORIA DE CÁLCULO\nDiseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "MEMORIA DESCRIPTIVA\nCriterios de diseño y normativas aplicadas\nConsideraciones técnicas\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "ESPECIFICACIONES TÉCNICAS\nCaracterísticas de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { detalle: "METRADOS\nMetrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { detalle: "COSTOS Y PRESUPUESTOS\nAnálisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
      ],
      sections: seccionesEstandarIngenieria
    },
    // ─── COT-TIP-PR ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-PR",
      name: "Costos y presupuestos de obra",
      category: "costos-presupuestos",
      projectData: { nombre: "Elaboración de presupuesto de obra", modalidad: "Proyecto por alcance", plazo: "60 días calendario" },
      items: [
        { detalle: "ELABORACIÓN DE METRADOS\nMetrados de Obras provisionales\nMetrados de la especialidad de Arquitectura\nMetrados de la especialidad de Estructuras\nMetrados de la especialidad de Instalaciones Sanitarias\nMetrados de la especialidad de Instalaciones Eléctricas\nMetrados de la especialidad de Agua contra Incendios\nMetrados de la especialidad de Telecomunicaciones\nMetrados de la especialidad de Instalaciones Mecánicas", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { detalle: "ELABORACIÓN DE PRESUPUESTO DE OBRA\nPresupuesto de Obras provisionales\nPresupuesto de cada especialidad\nAnálisis de precios unitarios\nFórmula polinómica\nRelación de insumos\nAnálisis de costos de materiales\nAnálisis de costos de mano de obra\nAnálisis de costos de equipos y herramientas\nDesagregado de gastos generales\nResumen del presupuesto general", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { detalle: "CRONOGRAMAS PARA LA EJECUCIÓN\nCronograma de ejecución de obra\nCronograma de adquisición de materiales\nCronograma de avance valorizado", cantidad: 1, precioUnitario: 750, total: 750 }
      ],
      sections: [
        { title: "Alcance del Servicio", content: "Los entregables son metrados y presupuestos de todas las especialidades mencionadas.\nCualquier requerimiento adicional deberá ser evaluado y presupuestado por separado.", enabled: true },
        { title: "Normativa Aplicable", content: "El desarrollo del presupuesto se realizará conforme a la normativa vigente nacional e internacional aplicable.\n- Reglamento Nacional de Edificaciones (RNE)\n- Reglamento de Contrataciones del Estado (cuando aplique)\n- Normativa vigente de costos y presupuestos utilizada en el sector construcción\n- Especificaciones Técnicas y Expediente Técnico proporcionados por el cliente", enabled: true },
        { title: "Metodología de trabajo", content: "El servicio se desarrollará bajo criterios técnicos, normativos y de buenas prácticas de ingeniería.\n- Se realizará revisión de planos de todas las especialidades\n- Se efectuarán reuniones de coordinación con el cliente\n- Se entregarán avances parciales para revisión y validación", enabled: true },
        { title: "Responsabilidades del Cliente", content: "El cliente se compromete a:\n- Proporcionar planos base (arquitectura, estructuras, etc.)\n- Brindar acceso al proyecto para visitas de campo de ser necesario\n- Revisar y aprobar oportunamente los entregables", enabled: true },
        { title: "Plazos de Ejecución", content: "El tiempo de realización del servicio es de aproximadamente:\nVisita de campo: 02 días calendario (En caso se requiera)\nDesarrollo de la especialidad: 60 días calendario\n\nLos plazos pueden verse afectados por falta de coordinación con el cliente o por incompatibilidades con otras especialidades.", enabled: true },
        { title: "Forma de Pago", content: "Se requerirá un adelanto del 50% del monto total para el inicio de actividades.\nSe cancelará el 30% a la aprobación de los planos en planta y el 20% restante antes del alcance del entregable final.\n\nEn caso de retrasos en los pagos, la entrega de informes y planos podrá verse afectada.", enabled: true },
        { title: "Validez de la Cotización", content: "La presente cotización tiene una validez de 15 días a partir de la fecha de emisión.\nLa presente cotización incluye IGV.\nCualquier modificación en los alcances del servicio o variaciones en los entregables podrá generar ajustes en el presupuesto.", enabled: true },
        { title: "Garantía del Servicio", content: "Se garantiza que el diseño será desarrollado conforme a la normativa vigente y criterios técnicos de ingeniería.\nEl cliente es el responsable de la construcción o ejecución de la propuesta de intervención.", enabled: true },
        { title: "Entrega de Productos Finales", content: "Los entregables incluirán planos, memorias, especificaciones, costos, según lo indicado en la cotización.\nLos documentos se entregarán en formato digital (PDF, DOC, XLS, DWG, según corresponda).", enabled: true },
        { title: "Exclusiones del Servicio", content: "Salvo indicación expresa, no se incluyen:\n- Levantamiento de información en campo\n- Elaboración o modificación de planos\n- Diseño de especialidades\n- Supervisión de obra\n- Actualización de Expediente Técnico\n- Valorizaciones de obra\n- Liquidaciones de obra\n- Costos derivados de cambios posteriores", enabled: true }
      ]
    },
    // ─── COT-TIP-RE ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-RE",
      name: "Inspección + Evaluación + Propuesta de reforzamiento",
      category: "inspeccion-evaluacion",
      projectData: { nombre: "Inspección y evaluación estructural", modalidad: "Proyecto por alcance", plazo: "42 días calendario" },
      items: [
        { detalle: "I. INSPECCIÓN ESTRUCTURAL\n\n1. LEVANTAMIENTO ESTRUCTURAL GENERAL\nRevisión de Información preliminar\nRegistro y documentación del estado actual en general\nVerificación de la infraestructura existente con planos del estado actual (As-build)", cantidad: 1, precioUnitario: 3000, total: 3000 },
        { detalle: "2. ENSAYOS EN LA SUPERESTRUCTURA\n2.1. Inspección Visual y Diagnóstico Inicial\nObservación de fisuras, desprendimientos, humedad o corrosión en refuerzos\nEvaluación de deformaciones, pandeo o colapso parcial de elementos estructurales\nIdentificación de asentamientos diferenciales y fallas por problemas del suelo\n\n2.2. Ensayos No Destructivos para Concreto\nPrueba de esclerometría (Martillo de Schmidt)\nPacometría (detector de armaduras)", cantidad: 1, precioUnitario: 3500, total: 3500 },
        { detalle: "3. INFORME DE INSPECCIÓN ESTRUCTURAL\nInterpretación de ensayos y comparaciones con normativa vigente (RNE, ACI, ASCE)\nInforme técnico con conclusiones y recomendaciones", cantidad: 1, precioUnitario: 500, total: 500 },
        { detalle: "II. EVALUACIÓN ESTRUCTURAL\n\n4. LEVANTAMIENTO ESTRUCTURAL A DETALLE\nLevantamiento mediante estación total o distanciómetro\nLevantamiento del acero de refuerzo existente mediante pacometría\nRealización de planos estructurales a detalle del estado actual (As-build)", cantidad: 1, precioUnitario: 4000, total: 4000 },
        { detalle: "5. ENSAYOS DESTRUCTIVOS\nExtracción de testigos de concreto → Ensayo de resistencia a compresión en laboratorio (Norma ASTM C42)", cantidad: 1, precioUnitario: 3000, total: 3000 },
        { detalle: "6. ENSAYOS EN EL SUELO (EMS)\nEstudio de Mecánica de Suelos (3 calicatas)\nPerfil del suelo, capacidad portante mediante triaxial y otros parámetros", cantidad: 1, precioUnitario: 4500, total: 4500 },
        { detalle: "6b. EVALUACIÓN ESTRUCTURAL\nRevisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nRevisión de Fuerzas y Esfuerzos\nChequeo de Resistencia de Cimentaciones, Columnas, Muros, Vigas, Losas", cantidad: 1, precioUnitario: 2500, total: 2500 },
        { detalle: "7. INFORME DE EVALUACIÓN ESTRUCTURAL\nInforme técnico con conclusiones y recomendaciones\nAnálisis de posibles soluciones de intervención estructural (refuerzo, rehabilitación o reconstrucción)", cantidad: 1, precioUnitario: 500, total: 500 },
        { detalle: "III. PROPUESTA DE INTERVENCIÓN\n\n8. PROPUESTA TÉCNICA\n8.1. Diseño de la propuesta de reforzamiento\n8.2. Dibujo de planos de la propuesta", cantidad: 1, precioUnitario: 4000, total: 4000 },
        { detalle: "9. MEMORIA DE CÁLCULO DE LA PROPUESTA\nDiseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño/Revisión de las Cimentaciones", cantidad: 1, precioUnitario: 2500, total: 2500 },
        { detalle: "10. INFORME FINAL", cantidad: 1, precioUnitario: 500, total: 500 }
      ],
      sections: [
        { title: "Alcance del Servicio", content: "La presente cotización cubre únicamente los servicios detallados en los ítems descritos.\nCualquier requerimiento adicional deberá ser evaluado y presupuestado por separado.\nLos ensayos destructivos y no destructivos están incluidos en esta cotización.\nLos ensayos destructivos serán realizados en un laboratorio.", enabled: true },
        { title: "Condiciones para la realización del Servicio", content: "Se requiere acceso total a las instalaciones para la inspección estructural.\nRestricciones de acceso o demora en autorizaciones por parte del cliente.\nEl cliente podrá realizar pruebas adicionales a las propuestas para la evaluación estructural.\nLa inspección de las cimentaciones se realizará solo en los puntos seleccionados para las calicatas y donde sea posible observarlas directamente.\nLos resultados de la evaluación y diseño estructural estarán sujetos a la disponibilidad y tiempos de respuesta del laboratorio acreditado contratado.", enabled: true },
        { title: "Responsabilidades del Cliente", content: "Facilitar documentación técnica existente y permisos necesarios para la inspección.\nGestionar la autorización para la realización de ensayos destructivos, como extracción de testigos de concreto o albañilería.\nAsumir cualquier costo adicional derivado de imprevistos durante los ensayos (reposición de materiales extraídos, reparaciones, etc.).", enabled: true },
        { title: "Plazos de Ejecución", content: "El tiempo de realización del servicio es de aproximadamente:\nInspección estructural: 07 días calendario\nEvaluación estructural: 20 días calendario\nPropuesta de intervención: 15 días calendario\n\nLos tiempos estimados dependen de la entrega de los resultados de los ensayos y de la compatibilidad con las otras especialidades.\nLos plazos podrán verse afectados por factores ajenos a nuestro control, tales como:\n- Disponibilidad del laboratorio acreditado\n- Restricciones de acceso o demora en autorizaciones por parte del cliente", enabled: true },
        { title: "Ensayos de Laboratorio", content: "Los ensayos destructivos serán realizados por un laboratorio, asegurando la calidad y precisión de los resultados.\nSe garantizará que los ensayos cumplan con las normativas vigentes (ASTM, ACI, RNE u otras aplicables).\nLa empresa contratante recibirá los informes oficiales emitidos por el laboratorio, anexados a nuestro informe técnico.", enabled: true },
        { title: "Forma de Pago", content: "Se requerirá un adelanto del 50% del monto total para el inicio de actividades.\nSe cancelará el 50% restante antes del alcance de los entregables.\n\nEn caso de retrasos en los pagos, la entrega de informes y planos podrá verse afectada.", enabled: true },
        { title: "Validez de la Cotización", content: "La presente cotización tiene una validez de 15 días a partir de la fecha de emisión.\nLa presente cotización incluye IGV.\nCualquier modificación en los alcances del servicio o variaciones en los entregables podrá generar ajustes en el presupuesto.", enabled: true },
        { title: "Garantía del Servicio", content: "Se garantiza el cumplimiento de normativas vigentes para el análisis y diseño estructural.\nNo nos hacemos responsables por daños ocultos o fallas estructurales no detectables en la inspección visual inicial.\nLa propuesta de intervención se basará en los resultados obtenidos durante la inspección y ensayos realizados por el laboratorio acreditado.\nEl cliente es el responsable de la construcción o ejecución de la propuesta de intervención.", enabled: true },
        { title: "Entrega de Productos Finales", content: "Los entregables incluirán informes técnicos, memorias de cálculo y planos estructurales, según lo indicado en la cotización.\nLos documentos se entregarán en formato digital (PDF, DOC, XLS, DWG, según corresponda).", enabled: true }
      ]
    },
    // ─── COT-TIP-CE ───────────────────────────────────────────────────────────
    {
      code: "COT-TIP-CE",
      name: "Construcción / Ejecución de obra",
      category: "construccion",
      projectData: { nombre: "Construcción", modalidad: "Proyecto por alcance", plazo: "40 días calendario" },
      items: [
        { detalle: "MANO DE OBRA\nEliminación de desmonte: S/1,500.00\nParedes y columnas: S/10,200.00\nTecho: S/12,500.00\nTarrajeo: S/10,000.00\nInstalaciones eléctricas: S/2,000.00\nInstalaciones sanitarias: S/1,750.00\nContrapiso: S/1,850.00\nPintura y empastado: S/6,500.00", cantidad: 1, precioUnitario: 44800, total: 44800 },
        { detalle: "MATERIALES\nParedes y columnas: S/10,500.00\nTecho: S/19,500.00\nTarrajeo: S/2,750.00\nInstalaciones eléctricas: S/2,750.00\nInstalaciones sanitarias: S/3,950.00\nContrapiso: S/1,850.00\nPintura y empastado: S/1,750.00", cantidad: 1, precioUnitario: 43050, total: 43050 },
        { detalle: "SEGURIDAD\nGastos de seguridad", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { detalle: "SUPERVISIÓN\nSupervisión y control de la calidad", cantidad: 1, precioUnitario: 4500, total: 4500 },
        { detalle: "UTILIDAD\nCorrección de planos: S/3,000.00\nUtilidad de la empresa: S/5,000.00", cantidad: 1, precioUnitario: 8000, total: 8000 }
      ],
      sections: []
    }
  ];


  let templatesCount = 0;
  for (const tpl of templatesPyramid) {
    await prisma.quoteTemplate.upsert({
      where: {
        companyId_code: { companyId: pyramid.id, code: tpl.code }
      },
      update: {
        name: tpl.name,
        category: tpl.category,
        projectData: tpl.projectData,
        items: tpl.items,
        sections: tpl.sections,
        isCustom: false,
      },
      create: {
        companyId: pyramid.id,
        code: tpl.code,
        name: tpl.name,
        category: tpl.category,
        projectData: tpl.projectData,
        items: tpl.items,
        sections: tpl.sections,
        isCustom: false,
      }
    });
    templatesCount++;
  }

  console.log(`✅ Seed completado. Empresas actualizadas/creadas: ${companiesCount}. Items de catálogo actualizados/creados: ${catalogItemsCount}. ${templatesCount} plantillas creadas/actualizadas.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
