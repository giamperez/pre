import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed...');

  // ---------------------------------------------------------
  // USUARIOS SUPERADMIN, ADMIN Y USUARIO (VENTAS)
  // ---------------------------------------------------------
  await prisma.user.upsert({
    where: { email: 'superadmin@vertexdev.tech' },
    update: { role: 'superadmin' },
    create: {
      email: 'superadmin@vertexdev.tech',
      password: bcrypt.hashSync('Vertex2026!', 10),
      name: 'Super Admin System',
      role: 'superadmin',
    },
  });
  await prisma.user.upsert({
    where: { email: 'admin@vertexdev.tech' },
    update: { role: 'admin' },
    create: {
      email: 'admin@vertexdev.tech',
      password: bcrypt.hashSync('Vertex2026!', 10),
      name: 'Admin Vertex',
      role: 'admin',
    },
  });
  await prisma.user.upsert({
    where: { email: 'ventas@vertexdev.tech' },
    update: { role: 'usuario' },
    create: {
      email: 'ventas@vertexdev.tech',
      password: bcrypt.hashSync('Vertex2026!', 10),
      name: 'Equipo Ventas',
      role: 'usuario',
    },
  });
  console.log('✅ Usuarios superadmin, admin y usuario (ventas) creados/verificados');

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
        { titulo: "DISEÑO DE LA SUPERESTRUCTURA", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural Completo del Edificio\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nAnálisis normativo por Viento\nRevisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de los Elementos Estructurales", cantidad: 1, precioUnitario: 500, total: 500 },
        { titulo: "DISEÑO DE COMPONENTES ESPECIALES", contenido: "Diseño de conexiones\nElementos de la fachada", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "DISEÑO DE CIMENTACIONES", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Deslizamiento y Volteo\nDiseño de Concreto Armado", cantidad: 1, precioUnitario: 300, total: 300 },
        { titulo: "DIBUJO DE PLANOS", contenido: "Planos en Planta\nPlanos de Elevaciones\nPlanos de Detalles Estructurales", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "MEMORIA DE CÁLCULO", contenido: "Diseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "MEMORIA DESCRIPTIVA", contenido: "Criterios de diseño y normativas aplicadas\nConsideraciones técnicas de la superestructura, componentes especiales y cimentaciones\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "ESPECIFICACIONES TÉCNICAS", contenido: "Características de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "METRADOS", contenido: "Metrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "COSTOS Y PRESUPUESTOS", contenido: "Análisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S (avance físico y financiero)\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
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
        { titulo: "REVISIÓN DE LA SUPERESTRUCTURA", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural Completo del Edificio\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático normativo, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nRevisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de Vigas\nDiseño de Columnas\nDiseño de Muros\nDiseño de Losas", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "REVISIÓN DE COMPONENTES ESPECIALES", contenido: "Diseño estructural de escalera\nElementos asociados a ascensores (cuando aplique)", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "REVISIÓN DE CIMENTACIONES", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Punzonamiento\nDiseño del Refuerzo en las cimentaciones de Columnas\nDiseño de Elementos de Conexión (Vigas)", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "REVISIÓN Y MODIFICACIÓN DE PLANOS", contenido: "Planos Generales en planta\nPlanos de Cimentaciones\nPlanos de Columnas y Muros\nPlanos de Losas y Vigas\nPlanos de Cortes Estructurales\nPlanos de Conexiones\nPlanos de Detalles Estructurales", cantidad: 1, precioUnitario: 800, total: 800 },
        { titulo: "MEMORIA DESCRIPTIVA", contenido: "Criterios de diseño y normativas aplicadas\nConsideraciones técnicas de la superestructura, componentes especiales y cimentaciones\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 350, total: 350 },
        { titulo: "MEMORIA DE CÁLCULO", contenido: "Diseño de las Cimentaciones\nDiseño de la Superestructura\nDiseño de los Componentes Especiales", cantidad: 1, precioUnitario: 350, total: 350 },
        { titulo: "ESPECIFICACIONES TÉCNICAS", contenido: "Características de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "METRADOS", contenido: "Metrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 350, total: 350 },
        { titulo: "COSTOS Y PRESUPUESTOS", contenido: "Análisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
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
        { titulo: "DISEÑO DE LA SUPERESTRUCTURA", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural Completo de la Cobertura\nAnálisis por Cargas Verticales\nAnálisis Sísmico Estático normativo, FLE\nAnálisis Sísmico Dinámico Modal Espectral, AMRE\nAnálisis normativo por Viento\nAnálisis normativo por cambios de Temperatura\nRevisión de Desplazamientos y Distorsiones\nRevisión de Deflexiones\nCombinaciones de Carga para el Diseño\nDiseño de Vigas\nDiseño de Columnas\nDiseño de Pedestales\nDiseño de Arriostres o Tensores", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "DISEÑO DE COMPONENTES ESPECIALES", contenido: "Conexiones de Placa base\nConexiones de Viga - columna\nConexiones de Arriostres\nConexiones a Otros Elementos\nDiseño de Pernos\nDiseño de Soportes para Canaletas\nDiseño de Soldadura", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "DISEÑO DE CIMENTACIONES", contenido: "Estructuración y Predimensionamiento\nModelamiento Estructural de la Cimentación\nRevisión de Presiones en el Terreno\nRevisión por Corte\nRevisión por Flexión\nRevisión por Punzonamiento\nDiseño del Refuerzo en las cimentaciones de Columnas\nDiseño de Elementos de Conexión (Vigas)", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "DIBUJO DE PLANOS", contenido: "Planos de Cimentaciones\nPlanos Generales en planta\nPlanos de Ejes\nPlanos de Cortes Estructurales\nPlanos de Conexiones\nPlanos de Detalles Estructurales\nPlanos de Componentes Especiales\nPlanos de Fabricación\nPlanos de Montaje", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "MEMORIA DE CÁLCULO", contenido: "Diseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "MEMORIA DESCRIPTIVA", contenido: "Criterios de diseño y normativas aplicadas\nConsideraciones técnicas\nDescripción de la función y materiales de los elementos estructurales\nSoluciones adoptadas para garantizar seguridad y funcionalidad", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "ESPECIFICACIONES TÉCNICAS", contenido: "Características de los materiales utilizados\nProcesos constructivos y criterios de ejecución\nRequisitos de calidad y normativas aplicables\nTolerancias permitidas y ensayos requeridos", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "METRADOS", contenido: "Metrados de la Superestructura\nMetrados de los Componentes Especiales\nMetrados de las Cimentaciones", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "COSTOS Y PRESUPUESTOS", contenido: "Análisis de precios unitarios (APU)\nDeterminación de costos directos e indirectos\nElaboración del presupuesto del proyecto\nDesarrollo de fórmulas polinómicas\nElaboración de cronograma valorizado de obra\nElaboración de curva S\nAnálisis de costos por fases constructivas\nCompatibilización entre metrados y planos", cantidad: 1, precioUnitario: 200, total: 200 }
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
        { titulo: "ELABORACIÓN DE METRADOS", contenido: "Metrados de Obras provisionales\nMetrados de la especialidad de Arquitectura\nMetrados de la especialidad de Estructuras\nMetrados de la especialidad de Instalaciones Sanitarias\nMetrados de la especialidad de Instalaciones Eléctricas\nMetrados de la especialidad de Agua contra Incendios\nMetrados de la especialidad de Telecomunicaciones\nMetrados de la especialidad de Instalaciones Mecánicas", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "ELABORACIÓN DE PRESUPUESTO DE OBRA", contenido: "Presupuesto de Obras provisionales\nPresupuesto de cada especialidad\nAnálisis de precios unitarios\nFórmula polinómica\nRelación de insumos\nAnálisis de costos de materiales\nAnálisis de costos de mano de obra\nAnálisis de costos de equipos y herramientas\nDesagregado de gastos generales\nResumen del presupuesto general", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "CRONOGRAMAS PARA LA EJECUCIÓN", contenido: "Cronograma de ejecución de obra\nCronograma de adquisición de materiales\nCronograma de avance valorizado", cantidad: 1, precioUnitario: 750, total: 750 }
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
        { titulo: "I. INSPECCIÓN ESTRUCTURAL", contenido: "\n1. LEVANTAMIENTO ESTRUCTURAL GENERAL\nRevisión de Información preliminar\nRegistro y documentación del estado actual en general\nVerificación de la infraestructura existente con planos del estado actual (As-build)", cantidad: 1, precioUnitario: 3000, total: 3000 },
        { titulo: "2. ENSAYOS EN LA SUPERESTRUCTURA", contenido: "2.1. Inspección Visual y Diagnóstico Inicial\nObservación de fisuras, desprendimientos, humedad o corrosión en refuerzos\nEvaluación de deformaciones, pandeo o colapso parcial de elementos estructurales\nIdentificación de asentamientos diferenciales y fallas por problemas del suelo\n\n2.2. Ensayos No Destructivos para Concreto\nPrueba de esclerometría (Martillo de Schmidt)\nPacometría (detector de armaduras)", cantidad: 1, precioUnitario: 3500, total: 3500 },
        { titulo: "3. INFORME DE INSPECCIÓN ESTRUCTURAL", contenido: "Interpretación de ensayos y comparaciones con normativa vigente (RNE, ACI, ASCE)\nInforme técnico con conclusiones y recomendaciones", cantidad: 1, precioUnitario: 500, total: 500 },
        { titulo: "II. EVALUACIÓN ESTRUCTURAL", contenido: "\n4. LEVANTAMIENTO ESTRUCTURAL A DETALLE\nLevantamiento mediante estación total o distanciómetro\nLevantamiento del acero de refuerzo existente mediante pacometría\nRealización de planos estructurales a detalle del estado actual (As-build)", cantidad: 1, precioUnitario: 4000, total: 4000 },
        { titulo: "5. ENSAYOS DESTRUCTIVOS", contenido: "Extracción de testigos de concreto → Ensayo de resistencia a compresión en laboratorio (Norma ASTM C42)", cantidad: 1, precioUnitario: 3000, total: 3000 },
        { titulo: "6. ENSAYOS EN EL SUELO (EMS)", contenido: "Estudio de Mecánica de Suelos (3 calicatas)\nPerfil del suelo, capacidad portante mediante triaxial y otros parámetros", cantidad: 1, precioUnitario: 4500, total: 4500 },
        { titulo: "6b. EVALUACIÓN ESTRUCTURAL", contenido: "Revisión de Desplazamientos y Distorsiones (Derivas)\nRevisión de Deflexiones\nRevisión de Fuerzas y Esfuerzos\nChequeo de Resistencia de Cimentaciones, Columnas, Muros, Vigas, Losas", cantidad: 1, precioUnitario: 2500, total: 2500 },
        { titulo: "7. INFORME DE EVALUACIÓN ESTRUCTURAL", contenido: "Informe técnico con conclusiones y recomendaciones\nAnálisis de posibles soluciones de intervención estructural (refuerzo, rehabilitación o reconstrucción)", cantidad: 1, precioUnitario: 500, total: 500 },
        { titulo: "III. PROPUESTA DE INTERVENCIÓN", contenido: "\n8. PROPUESTA TÉCNICA\n8.1. Diseño de la propuesta de reforzamiento\n8.2. Dibujo de planos de la propuesta", cantidad: 1, precioUnitario: 4000, total: 4000 },
        { titulo: "9. MEMORIA DE CÁLCULO DE LA PROPUESTA", contenido: "Diseño de la Superestructura\nDiseño de los Componentes Especiales\nDiseño/Revisión de las Cimentaciones", cantidad: 1, precioUnitario: 2500, total: 2500 },
        { titulo: "10. INFORME FINAL", contenido: "", cantidad: 1, precioUnitario: 500, total: 500 }
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
        { titulo: "MANO DE OBRA", contenido: "Eliminación de desmonte: S/1,500.00\nParedes y columnas: S/10,200.00\nTecho: S/12,500.00\nTarrajeo: S/10,000.00\nInstalaciones eléctricas: S/2,000.00\nInstalaciones sanitarias: S/1,750.00\nContrapiso: S/1,850.00\nPintura y empastado: S/6,500.00", cantidad: 1, precioUnitario: 44800, total: 44800 },
        { titulo: "MATERIALES", contenido: "Paredes y columnas: S/10,500.00\nTecho: S/19,500.00\nTarrajeo: S/2,750.00\nInstalaciones eléctricas: S/2,750.00\nInstalaciones sanitarias: S/3,950.00\nContrapiso: S/1,850.00\nPintura y empastado: S/1,750.00", cantidad: 1, precioUnitario: 43050, total: 43050 },
        { titulo: "SEGURIDAD", contenido: "Gastos de seguridad", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "SUPERVISIÓN", contenido: "Supervisión y control de la calidad", cantidad: 1, precioUnitario: 4500, total: 4500 },
        { titulo: "UTILIDAD", contenido: "Corrección de planos: S/3,000.00\nUtilidad de la empresa: S/5,000.00", cantidad: 1, precioUnitario: 8000, total: 8000 }
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

  // ---------------------------------------------------------
  // PLANTILLAS: VERTEX DEVELOPERS
  // ---------------------------------------------------------
  const seccionesVertex = [
    { title: "Alcance del Servicio", content: "El presente servicio comprende el desarrollo e implementación de las funcionalidades descritas en esta cotización, conforme a los requerimientos previamente definidos y aprobados por el cliente.\n\nCualquier modificación al alcance o incorporación de nuevas funcionalidades será evaluada y cotizada por separado.\n\nLa presente cotización comprende únicamente los entregables descritos en este documento.", enabled: true },
    { title: "Condiciones para la realización del Servicio", content: "El cliente deberá proporcionar oportunamente toda la información necesaria para el desarrollo del proyecto, incluyendo textos, imágenes, logotipos, manual de identidad visual, catálogos de productos y demás recursos requeridos.\n\nEn caso de requerirse acceso a servicios de terceros (hosting, dominio, pasarelas de pago, correos corporativos, APIs, entre otros), el cliente deberá proporcionar las credenciales correspondientes.\n\nLos retrasos ocasionados por la entrega tardía de información, aprobaciones o accesos podrán modificar el cronograma de ejecución sin generar responsabilidad para Vertex Developers.", enabled: true },
    { title: "Responsabilidades del Cliente", content: "• Proporcionar oportunamente la información y recursos necesarios.\n• Aprobar los requerimientos funcionales antes del inicio del desarrollo.\n• Designar un responsable de proyecto que pueda tomar decisiones y aprobar entregables.\n• Realizar las pruebas de aceptación en los plazos establecidos.", enabled: true },
    { title: "Plazos de Ejecución", content: "El tiempo estimado para el desarrollo del proyecto es el indicado en esta cotización, distribuido entre las etapas de: análisis y levantamiento de requerimientos, diseño de interfaces (UI/UX), desarrollo, y pruebas e implementación.\n\n*El plazo es referencial y está sujeto a la entrega oportuna de información por parte del cliente y a la aceptación de servicios de terceros (pasarelas de pago, APIs externas).", enabled: true },
    { title: "Pruebas y Aceptación", content: "Antes de la entrega final se realizarán pruebas funcionales para verificar el correcto funcionamiento de las funcionalidades incluidas en el alcance.\n\nEl cliente dispondrá de un período de revisión de hasta 5 días calendario para reportar observaciones relacionadas con el alcance contratado.\n\nLas observaciones que impliquen nuevas funcionalidades serán consideradas como requerimientos adicionales y serán cotizadas por separado.", enabled: true },
    { title: "Forma de Pago", content: "• 40% del monto total al aceptar la cotización, como adelanto para el inicio del proyecto.\n• 30% al aprobar la maqueta funcional (frontend), una vez validado el diseño, la estructura y la experiencia de usuario.\n• 30% restante al concluir el desarrollo, luego de la demostración de las funcionalidades del sistema.\n\nLos entregables del proyecto serán entregados una vez confirmado el pago del 100% del monto contratado.", enabled: true },
    { title: "Validez de la Cotización", content: "La presente cotización tiene una vigencia de 15 días calendario contados desde su fecha de emisión.\n\nLa presente cotización incluye IGV.", enabled: true },
    { title: "Garantía del Servicio", content: "Vertex Developers brinda una garantía de 60 días calendario contados a partir de la entrega del proyecto.\n\nLa garantía cubre exclusivamente la corrección de errores de programación relacionados con las funcionalidades incluidas en el alcance aprobado.\n\nLa garantía no incluye:\n• Nuevas funcionalidades.\n• Cambios en los procesos del negocio.\n• Problemas ocasionados por terceros o por el servidor/hosting.", enabled: true },
    { title: "Licencia de Uso del software", content: "Con la entrega del proyecto y una vez efectuado el pago total del servicio, el cliente adquiere una licencia de uso sobre la solución desarrollada.\n\nLos componentes tecnológicos, librerías, frameworks, plantillas y arquitecturas desarrollados previamente por Vertex Developers continúan siendo de su titularidad.\n\nLa entrega del código fuente únicamente se realizará cuando haya sido expresamente incluida en la presente cotización.", enabled: true },
    { title: "Entrega de Productos Finales", content: "Al finalizar el proyecto se entregará:\n• Aplicación web/móvil completamente funcional e implementada.\n• Manual de usuario.\n• Credenciales de acceso a los servicios contratados.\n• Capacitación para el personal designado.\n• Acta de conformidad del servicio.", enabled: true }
  ];

  const plantillasVertex = [
    {
      code: "VX-TIP-LANDING",
      name: "Landing page / Sitio corporativo simple",
      category: "web",
      companySlug: "vertex-developers",
      projectData: { nombre: "Desarrollo de sitio web corporativo", modalidad: "Proyecto por alcance", plazo: "30 días calendario" },
      items: [
        { titulo: "DISEÑO UI/UX", contenido: "Diseño de wireframes y mockups\nDiseño responsive (desktop y mobile)\nPaleta de colores y tipografía según identidad de marca\nHasta 5 secciones: Hero, Nosotros, Servicios, Portafolio, Contacto", cantidad: 1, precioUnitario: 400, total: 400 },
        { titulo: "DESARROLLO FRONTEND", contenido: "Maquetado HTML/CSS/JS o React\nAnimaciones y transiciones\nFormulario de contacto con envío a correo\nIntegración de mapa (Google Maps)\nOptimización de velocidad de carga", cantidad: 1, precioUnitario: 600, total: 600 },
        { titulo: "SEO BÁSICO ON-PAGE", contenido: "Meta tags, títulos y descripciones\nEstructura de encabezados\nSitemap XML\nConfiguración Google Search Console", cantidad: 1, precioUnitario: 200, total: 200 },
        { titulo: "DESPLIEGUE Y CONFIGURACIÓN", contenido: "Configuración de hosting y dominio\nInstalación de certificado SSL\nDespliegue en producción\nPruebas de funcionamiento", cantidad: 1, precioUnitario: 300, total: 300 }
      ],
      sections: seccionesVertex
    },
    {
      code: "VX-TIP-ECOMMERCE",
      name: "E-commerce / Tienda online",
      category: "web",
      companySlug: "vertex-developers",
      projectData: { nombre: "Desarrollo de tienda online", modalidad: "Proyecto por alcance", plazo: "60 días calendario" },
      items: [
        { titulo: "DISEÑO UI/UX", contenido: "Diseño de interfaces para tienda, carrito y checkout\nDiseño responsive\nDashboard administrativo", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "CATÁLOGO DE PRODUCTOS", contenido: "Gestión de productos con categorías, variantes y stock\nGalería de imágenes por producto\nBúsqueda y filtros avanzados\nProductos relacionados y destacados", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "CARRITO Y CHECKOUT", contenido: "Carrito de compras persistente\nFlujo de checkout en pasos\nCálculo automático de envío\nResumen de pedido", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "INTEGRACIÓN DE PAGOS", contenido: "Yape, Plin, transferencia bancaria\nPasarela de tarjetas (Culqi o Mercado Pago)\nConfirmación de pago automática\nNotificación por correo al cliente y administrador", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "PANEL ADMINISTRATIVO", contenido: "Gestión de pedidos (pendiente, en proceso, enviado, entregado)\nGestión de clientes\nReportes de ventas\nControl de inventario", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "DESPLIEGUE Y CONFIGURACIÓN", contenido: "Configuración de servidor y dominio\nSSL, backups automáticos\nPruebas de carga y seguridad", cantidad: 1, precioUnitario: 1500, total: 1500 }
      ],
      sections: seccionesVertex
    },
    {
      code: "VX-TIP-SAAS",
      name: "Software / SaaS a medida",
      category: "software",
      companySlug: "vertex-developers",
      projectData: { nombre: "Desarrollo de software a medida", modalidad: "Proyecto por alcance", plazo: "90 días calendario" },
      items: [
        { titulo: "LEVANTAMIENTO DE REQUERIMIENTOS", contenido: "Entrevistas con stakeholders\nDocumentación de requerimientos funcionales y no funcionales\nDiagramas de flujo y casos de uso\nDefinición de arquitectura técnica", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "DISEÑO UI/UX", contenido: "Prototipo interactivo (Figma)\nSistema de diseño y componentes\nFlujos de usuario\nDiseño responsive", cantidad: 1, precioUnitario: 1500, total: 1500 },
        { titulo: "DESARROLLO BACKEND", contenido: "API REST con NestJS\nBase de datos PostgreSQL\nAutenticación y autorización (JWT, roles)\nLógica de negocio según requerimientos\nDocumentación de API", cantidad: 1, precioUnitario: 3000, total: 3000 },
        { titulo: "DESARROLLO FRONTEND", contenido: "Interface React/Vite\nConsumo de API\nGráficas y reportes\nExportación de datos (PDF, Excel)", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "PRUEBAS Y QA", contenido: "Pruebas unitarias e integración\nPruebas de usuario (UAT)\nCorrección de bugs\nDocumentación técnica", cantidad: 1, precioUnitario: 500, total: 500 }
      ],
      sections: seccionesVertex
    },
    {
      code: "VX-TIP-MOBILE",
      name: "App móvil (Android / iOS)",
      category: "mobile",
      companySlug: "vertex-developers",
      projectData: { nombre: "Desarrollo de aplicación móvil", modalidad: "Proyecto por alcance", plazo: "90 días calendario" },
      items: [
        { titulo: "DISEÑO UI/UX MOBILE", contenido: "Prototipo interactivo para móvil\nDiseño de pantallas y flujos\nSistema de diseño adaptado a iOS y Android\nAnimaciones y microinteracciones", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "DESARROLLO APP (React Native / Flutter)", contenido: "Navegación y estructura de la app\nIntegración con API backend\nNotificaciones push\nAlmacenamiento local\nSoporte Android e iOS", cantidad: 1, precioUnitario: 5000, total: 5000 },
        { titulo: "BACKEND Y API", contenido: "API REST para la app\nAutenticación con JWT\nGestión de usuarios y perfiles\nBase de datos y almacenamiento", cantidad: 1, precioUnitario: 2000, total: 2000 },
        { titulo: "PUBLICACIÓN EN TIENDAS", contenido: "Configuración de cuenta Google Play y App Store\nPreparación de assets (íconos, capturas)\nPublicación y revisión\nSoporte post-publicación (30 días)", cantidad: 1, precioUnitario: 3000, total: 3000 }
      ],
      sections: seccionesVertex
    },
    {
      code: "VX-TIP-CATALOGO",
      name: "Página web con catálogo",
      category: "web",
      companySlug: "vertex-developers",
      projectData: { nombre: "Desarrollo de web con catálogo", modalidad: "Proyecto por alcance", plazo: "45 días calendario" },
      items: [
        { titulo: "DISEÑO UI/UX", contenido: "Diseño de landing + catálogo\nDiseño responsive\nFichas de producto", cantidad: 1, precioUnitario: 600, total: 600 },
        { titulo: "CATÁLOGO DE PRODUCTOS/SERVICIOS", contenido: "Listado con categorías y filtros\nFicha de producto con galería de imágenes\nBúsqueda por nombre o categoría\nBotón de consulta vía WhatsApp por producto", cantidad: 1, precioUnitario: 1000, total: 1000 },
        { titulo: "PANEL ADMINISTRATIVO", contenido: "Gestión de productos y categorías (CRUD)\nCarga de imágenes\nActivar/desactivar productos", cantidad: 1, precioUnitario: 800, total: 800 },
        { titulo: "DESPLIEGUE Y CONFIGURACIÓN", contenido: "Hosting, dominio, SSL\nDespliegue en producción", cantidad: 1, precioUnitario: 600, total: 600 }
      ],
      sections: seccionesVertex
    }
  ];

  for (const tpl of plantillasVertex) {
    const co = tpl.companySlug === 'vertex-developers' ? vertex : null;
    if (!co) continue;
    await prisma.quoteTemplate.upsert({
      where: { companyId_code: { companyId: co.id, code: tpl.code } },
      update: {
        name: tpl.name,
        category: tpl.category,
        type: 'cotizacion',
        projectData: { ...tpl.projectData, showInPrequote: true },
        items: tpl.items,
        sections: tpl.sections,
        isCustom: false,
      },
      create: {
        code: tpl.code,
        companyId: co.id,
        name: tpl.name,
        category: tpl.category,
        type: 'cotizacion',
        projectData: { ...tpl.projectData, showInPrequote: true },
        items: tpl.items,
        sections: tpl.sections,
        isCustom: false,
      }
    });
    templatesCount++;
  }

  // ---------------------------------------------------------
  // PLANTILLAS DE PRECOTIZACIÓN PRECARGADAS (VERTEX Y PYRAMID)
  // ---------------------------------------------------------
  const precotizacionesSeed = [
    {
      companyId: vertex.id,
      code: "PRECOT-VERTEX-MASTER",
      name: "Precotización General - Soluciones Tecnológicas Vertex",
      category: "precotizacion",
      type: "precotizacion",
      projectData: { showInPrequote: true },
      items: [],
      cardsConfig: {
        botEnabled: true,
        botWelcome: "¡Hola! 👋 Bienvenido a Vertex Developers. ¿En qué solución tecnológica o software estás interesado hoy?",
        botPrompt: "Eres el asistente comercial inteligente de Vertex Developers. Tu función es orientar al cliente sobre desarrollo web, tiendas virtuales e-commerce, aplicaciones móviles y software SaaS a medida, sugiriendo los adicionales y guiándolo a generar su precotización.",
        botTone: "comercial",
        mandatoryFields: ["nombre", "telefono", "correo", "empresa"],
        cards: [
          {
            _key: "card-v1",
            serviceName: "Landing Page Corporativa",
            subtitle: "Sitio web corporativo de impacto de 1 a 5 secciones con diseño responsive y SEO",
            whyIdeal: "Ideal para marcas que buscan presencia digital inmediata, ágil y profesional.",
            includedAddons: ["Hosting & Dominio por 1 año", "Formulario de contacto a correo", "Certificado SSL de seguridad"],
            basePrice: 1500,
            ctaText: "Precotizar Landing Page",
            imageUrl: "/companies/vertex-developers/portada.jpeg",
            videoUrl: "/companies/vertex-developers/video1.mp4"
          },
          {
            _key: "card-v2",
            serviceName: "Tienda Online E-commerce",
            subtitle: "Catálogo de productos, carrito de compras, gestión de stock y pasarela de pagos integrada",
            whyIdeal: "Ideal para comercios y empresas que desean vender sus productos 24/7 en internet.",
            includedAddons: ["Pasarela de tarjeta (Culqi/MercadoPago)", "Cobros por Yape y Plin", "Panel administrativo intuitivo"],
            basePrice: 4500,
            ctaText: "Precotizar E-commerce",
            imageUrl: "/companies/vertex-developers/portada.jpeg",
            videoUrl: "/companies/vertex-developers/video1.mp4"
          },
          {
            _key: "card-v3",
            serviceName: "Software SaaS a Medida",
            subtitle: "Sistema de gestión web con backend en NestJS, PostgreSQL y panel administrativo interactivo",
            whyIdeal: "Para empresas con operaciones complejas que requieren digitalizar y automatizar sus procesos.",
            includedAddons: ["Arquitectura Cloud Escalable", "Módulo de Reportes en Excel/PDF", "Soporte y Garantía de 60 días"],
            basePrice: 8000,
            ctaText: "Precotizar Software SaaS",
            imageUrl: "/companies/vertex-developers/portada.jpeg",
            videoUrl: "/companies/vertex-developers/video1.mp4"
          },
          {
            _key: "card-v4",
            serviceName: "Aplicación Móvil (Android / iOS)",
            subtitle: "App nativa o multiplataforma con interfaz amigable, autenticación y notificaciones push",
            whyIdeal: "Para startups y negocios que desean estar en la pantalla de inicio de sus clientes.",
            includedAddons: ["Publicación en Google Play y App Store", "API REST de conexión", "Notificaciones Push"],
            basePrice: 12000,
            ctaText: "Precotizar App Móvil",
            imageUrl: "/companies/vertex-developers/portada.jpeg",
            videoUrl: "/companies/vertex-developers/video1.mp4"
          }
        ]
      }
    },
    {
      companyId: pyramid.id,
      code: "PRECOT-PYRAMID-MASTER",
      name: "Precotización General - Servicios de Ingeniería Pyramid",
      category: "precotizacion",
      type: "precotizacion",
      projectData: { showInPrequote: true },
      items: [],
      cardsConfig: {
        botEnabled: true,
        botWelcome: "¡Hola! 👋 Bienvenido a Pyramid Structures. ¿En qué proyecto estructural o de construcción te podemos ayudar?",
        botPrompt: "Eres el asistente comercial especialista de Pyramid Structures. Tu objetivo es responder sobre diseño estructural, inspecciones, metrados, presupuestos y construcción de obra según la normativa RNE vigente.",
        botTone: "tecnico-comercial",
        mandatoryFields: ["nombre", "telefono", "correo", "empresa"],
        cards: [
          {
            _key: "card-p1",
            serviceName: "Diseño y Cálculo Estructural",
            subtitle: "Modelamiento 3D, análisis sísmico y memoria de cálculo según RNE E.030 / E.060",
            whyIdeal: "Para edificaciones nuevas residenciales, comerciales e naves industriales.",
            includedAddons: ["Planos de cimentaciones, columnas y vigas", "Firma de Ingeniero Civil Colegiado", "Soporte ante observaciones municipales"],
            basePrice: 3500,
            ctaText: "Precotizar Diseño Estructural",
            imageUrl: "/companies/pyramid-structures/portada.jpeg",
            videoUrl: ""
          },
          {
            _key: "card-p2",
            serviceName: "Inspección y Evaluación Estructural",
            subtitle: "Levantamiento as-built, ensayos no destructivos (esclerometría/pacometría) e informe técnico",
            whyIdeal: "Para edificaciones existentes con fisuras o que requieren evaluación para ampliación.",
            includedAddons: ["Pruebas de Esclerometría", "Pacometría de acero existente", "Estudio de Mecánica de Suelos"],
            basePrice: 4500,
            ctaText: "Precotizar Inspección",
            imageUrl: "/companies/pyramid-structures/portada.jpeg",
            videoUrl: ""
          },
          {
            _key: "card-p3",
            serviceName: "Elaboración de Metrados y Presupuesto",
            subtitle: "Cómputo métrico de todas las especialidades, análisis de precios unitarios y fórmula polinómica",
            whyIdeal: "Para contratistas y propietarios que requieren costear su obra con precisión.",
            includedAddons: ["Desagregado de gastos generales", "Cronograma valorizado de avance", "Relación de insumos requeridos"],
            basePrice: 2750,
            ctaText: "Precotizar Presupuesto",
            imageUrl: "/companies/pyramid-structures/portada.jpeg",
            videoUrl: ""
          },
          {
            _key: "card-p4",
            serviceName: "Construcción y Ejecución de Obra",
            subtitle: "Ejecución integral de proyectos de construcción con mano de obra calificada y supervisión",
            whyIdeal: "Para quienes buscan garantizar la calidad y durabilidad de su construcción.",
            includedAddons: ["Supervisión técnica de obra", "Control de seguridad en el trabajo", "Entrega con Acta de Conformidad"],
            basePrice: 25000,
            ctaText: "Precotizar Construcción",
            imageUrl: "/companies/pyramid-structures/portada.jpeg",
            videoUrl: ""
          }
        ]
      }
    }
  ];

  for (const preTpl of precotizacionesSeed) {
    await prisma.quoteTemplate.upsert({
      where: { companyId_code: { companyId: preTpl.companyId, code: preTpl.code } },
      update: {
        name: preTpl.name,
        category: preTpl.category,
        type: preTpl.type,
        projectData: preTpl.projectData,
        items: preTpl.items,
        cardsConfig: preTpl.cardsConfig,
        isCustom: false,
      },
      create: {
        code: preTpl.code,
        companyId: preTpl.companyId,
        name: preTpl.name,
        category: preTpl.category,
        type: preTpl.type,
        projectData: preTpl.projectData,
        items: preTpl.items,
        cardsConfig: preTpl.cardsConfig,
        isCustom: false,
      }
    });
    templatesCount++;
  }

  // ---------------------------------------------------------
  // DISPONIBILIDAD (Lunes a Viernes, Mañana: 08:00–13:30, Tarde: 15:00–19:00)
  // ---------------------------------------------------------
  const workDays = [1, 2, 3, 4, 5]; // 0=Domingo, 1=Lunes...5=Viernes, 6=Sábado

  // Limpiar disponibilidades previas
  await prisma.availability.deleteMany({});

  for (const day of workDays) {
    // Vertex - Mañana (consultar)
    await prisma.availability.create({
      data: {
        companyId: vertex.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '13:30',
        slotMinutes: 30,
        isActive: true,
        type: 'consultar',
      },
    });

    // Vertex - Tarde (disponible)
    await prisma.availability.create({
      data: {
        companyId: vertex.id,
        dayOfWeek: day,
        startTime: '15:00',
        endTime: '19:00',
        slotMinutes: 30,
        isActive: true,
        type: 'disponible',
      },
    });

    // Pyramid - Mañana (consultar)
    await prisma.availability.create({
      data: {
        companyId: pyramid.id,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '13:30',
        slotMinutes: 30,
        isActive: true,
        type: 'consultar',
      },
    });

    // Pyramid - Tarde (disponible)
    await prisma.availability.create({
      data: {
        companyId: pyramid.id,
        dayOfWeek: day,
        startTime: '15:00',
        endTime: '19:00',
        slotMinutes: 30,
        isActive: true,
        type: 'disponible',
      },
    });
  }
  console.log('✅ Disponibilidad semanal (mañana y tarde) creada para Vertex y Pyramid');

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
