import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const vertex = await prisma.company.findUnique({ where: { slug: 'vertex-developers' } });
  if (!vertex) {
    console.log('Empresa vertex-developers no encontrada');
    return;
  }

  const templates = await prisma.quoteTemplate.findMany({
    where: { companyId: vertex.id },
  });

  console.log(`Vertex ID: ${vertex.id}`);
  console.log(`Encontradas ${templates.length} plantillas para Vertex Developers:`);

  for (const t of templates) {
    console.log(`\n========================================`);
    console.log(`ID: ${t.id} | Code: ${t.code} | Name: ${t.name} | Type: ${t.type} | Category: ${t.category}`);
    console.log(`Items (${Array.isArray(t.items) ? (t.items as any[]).length : 0}):`);
    console.log(JSON.stringify(t.items, null, 2));
    console.log(`Sections (${Array.isArray(t.sections) ? (t.sections as any[]).length : 0}):`);
    console.log(JSON.stringify(t.sections, null, 2));
  }
}

check().catch(console.error).finally(() => prisma.$disconnect());
