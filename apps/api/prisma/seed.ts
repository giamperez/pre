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

  console.log(`✅ Seed completado. Empresas actualizadas/creadas: ${companiesCount}. Items de catálogo actualizados/creados: ${catalogItemsCount}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
