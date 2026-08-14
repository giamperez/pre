import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Backfill único: replica imageUrl/videoUrl de las tarjetas de precotización
 * (QuoteTemplate.cardsConfig.cards) hacia ServiceCatalogItem, emparejando por
 * nombre de servicio. A partir de ahora TemplatesService lo hace automáticamente
 * en cada guardado, pero las plantillas guardadas antes de este fix necesitan
 * este backfill una sola vez.
 */
async function sync() {
  const templates = await prisma.quoteTemplate.findMany({
    where: { type: 'precotizacion' },
  });

  console.log(`Encontradas ${templates.length} plantillas de precotización.`);

  let updated = 0;
  let created = 0;
  let skipped = 0;

  for (const t of templates) {
    const cards = (t.cardsConfig as any)?.cards;
    if (!Array.isArray(cards)) continue;

    for (const card of cards) {
      const name = (card?.serviceName || '').trim();
      if (!name) continue;
      if (!card.imageUrl && !card.videoUrl) {
        skipped++;
        continue;
      }

      const imageUrl = card.imageUrl?.trim() || null;
      const videoUrl = card.videoUrl?.trim() || null;

      const existing = await prisma.serviceCatalogItem.findUnique({
        where: { companyId_name: { companyId: t.companyId, name } },
      });

      await prisma.serviceCatalogItem.upsert({
        where: { companyId_name: { companyId: t.companyId, name } },
        update: { imageUrl, videoUrl },
        create: {
          companyId: t.companyId,
          name,
          category: 'General',
          basePrice: card.basePrice || 0,
          isAddon: false,
          imageUrl,
          videoUrl,
        },
      });

      if (existing) {
        updated++;
        console.log(`  ✓ Actualizado: "${name}" (companyId: ${t.companyId})`);
      } else {
        created++;
        console.log(`  + Creado: "${name}" (companyId: ${t.companyId})`);
      }
    }
  }

  console.log(`\nListo. ${updated} actualizados, ${created} creados, ${skipped} sin imagen/video (omitidos).`);
}

sync().catch(console.error).finally(() => prisma.$disconnect());
