import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTemplateDto } from './dto/create-template.dto';

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByCompany(companySlug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });
    if (!company) {
      throw new NotFoundException('Company not found');
    }
    return this.prisma.quoteTemplate.findMany({
      where: { companyId: company.id },
      orderBy: { createdAt: 'desc' },
      include: {
        company: true,
      },
    });
  }

  async findOne(id: string) {
    const template = await this.prisma.quoteTemplate.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async create(createTemplateDto: CreateTemplateDto) {
    const created = await this.prisma.quoteTemplate.create({
      data: {
        companyId: createTemplateDto.companyId,
        code: createTemplateDto.code,
        name: createTemplateDto.name,
        category: createTemplateDto.category,
        type: createTemplateDto.type || 'cotizacion',
        projectData: (createTemplateDto.projectData as object) || {},
        items: (createTemplateDto.items as object[]) || [],
        sections: createTemplateDto.sections ? (createTemplateDto.sections as object[]) : undefined,
        cardsConfig: createTemplateDto.cardsConfig ? (createTemplateDto.cardsConfig as object) : undefined,
        customFields: createTemplateDto.customFields ? (createTemplateDto.customFields as object[]) : undefined,
        isCustom: createTemplateDto.isCustom ?? true,
      },
    });

    const syncedCardsConfig = await this.syncCatalogMediaFromCards(created.companyId, created.cardsConfig);
    if (syncedCardsConfig) {
      return this.prisma.quoteTemplate.update({ where: { id: created.id }, data: { cardsConfig: syncedCardsConfig } });
    }
    return created;
  }

  async update(id: string, updateData: any) {
    const existing = await this.prisma.quoteTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');

    const { id: _id, additionalItems, company, createdAt, updatedAt, ...cleanData } = updateData;

    const updated = await this.prisma.quoteTemplate.update({
      where: { id },
      data: cleanData,
    });

    const syncedCardsConfig = await this.syncCatalogMediaFromCards(updated.companyId, updated.cardsConfig);
    if (syncedCardsConfig) {
      return this.prisma.quoteTemplate.update({ where: { id }, data: { cardsConfig: syncedCardsConfig } });
    }
    return updated;
  }

  /**
   * Nombres de servicio equivalentes salvo mayúsculas/tildes/puntuación no deben
   * generar catalog items duplicados (ej. "Software / SaaS a medida" vs
   * "Software SaaS a Medida").
   */
  private normalizeServiceName(name: string): string {
    const DIACRITICS = /[̀-ͯ]/g;
    return name
      .normalize('NFD')
      .replace(DIACRITICS, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /**
   * El editor de precotización guarda imagen/video por servicio dentro de
   * cardsConfig.cards (JSON de la plantilla). El precotizador público, en cambio,
   * lee los servicios desde ServiceCatalogItem. Este método replica imageUrl/videoUrl
   * hacia el catalog item correspondiente y "fija" la relación guardando
   * card.catalogItemId. Una vez fijado, los siguientes guardados actualizan por id
   * directamente sin depender de que el nombre de la tarjeta siga coincidiendo con
   * el del catálogo (el nombre puede diferir en orden de palabras/redacción y no
   * solo en mayúsculas o tildes, así que el emparejo por nombre solo se usa la
   * primera vez, como mejor esfuerzo).
   *
   * Devuelve el cardsConfig actualizado (con catalogItemId agregado) si hubo
   * cambios, o null si no fue necesario modificarlo.
   */
  private async syncCatalogMediaFromCards(companyId: string, cardsConfig: unknown): Promise<any | null> {
    const config = cardsConfig as any;
    const cards = config?.cards;
    if (!Array.isArray(cards)) return null;

    const existingItems = await this.prisma.serviceCatalogItem.findMany({ where: { companyId } });
    const byId = new Map(existingItems.map(item => [item.id, item]));
    const byNormalizedName = new Map(
      existingItems.map(item => [this.normalizeServiceName(item.name), item]),
    );

    let mutated = false;
    const nextCards: any[] = [];

    for (const card of cards) {
      const name = (card?.serviceName || '').trim();
      if (!name) {
        nextCards.push(card);
        continue;
      }

      const imageUrl = card.imageUrl?.trim() || null;
      const videoUrl = card.videoUrl?.trim() || null;

      let target = card.catalogItemId ? byId.get(card.catalogItemId) : undefined;
      if (!target) {
        target = byNormalizedName.get(this.normalizeServiceName(name));
      }

      if (target) {
        await this.prisma.serviceCatalogItem.update({
          where: { id: target.id },
          data: { imageUrl, videoUrl },
        });
      } else {
        target = await this.prisma.serviceCatalogItem.create({
          data: {
            companyId,
            name,
            category: 'General',
            basePrice: card.basePrice || 0,
            isAddon: false,
            imageUrl,
            videoUrl,
          },
        });
      }

      if (card.catalogItemId !== target.id) {
        mutated = true;
        nextCards.push({ ...card, catalogItemId: target.id });
      } else {
        nextCards.push(card);
      }
    }

    if (!mutated) return null;
    return { ...config, cards: nextCards };
  }

  async remove(id: string) {
    const existing = await this.prisma.quoteTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template not found');

    return this.prisma.quoteTemplate.delete({
      where: { id },
    });
  }
}
