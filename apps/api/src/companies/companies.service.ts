import { Injectable, BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

const IMAGE_FIELD_TO_COLUMN: Record<string, 'logoUrl' | 'coverImageUrl' | 'backCoverImageUrl' | 'letterheadUrl'> = {
  logo: 'logoUrl',
  portada: 'coverImageUrl',
  contraportada: 'backCoverImageUrl',
  membrete: 'letterheadUrl',
};

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function serialize<T extends { paymentInfo?: string | null }>(company: T) {
  let paymentInfo: Record<string, unknown> | null = null;
  if (company.paymentInfo) {
    try {
      paymentInfo = JSON.parse(company.paymentInfo);
    } catch {
      paymentInfo = null;
    }
  }
  return { ...company, paymentInfo };
}

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const companies = await this.prisma.company.findMany({ orderBy: { name: 'asc' } });
    return companies.map(serialize);
  }

  async create(data: CreateCompanyDto) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('El nombre de la empresa es obligatorio');

    const slug = slugify(data.slug || name);
    if (!slug) throw new BadRequestException('El slug de la empresa no es válido');

    const existing = await this.prisma.company.findUnique({ where: { slug } });
    if (existing) throw new ConflictException(`Ya existe una empresa con el slug "${slug}"`);

    const created = await this.prisma.company.create({
      data: {
        name,
        slug,
        colorPrimary: data.colorPrimary || undefined,
        colorSecondary: data.colorSecondary || undefined,
        contactPhone: data.contactPhone || undefined,
        contactEmail: data.contactEmail || undefined,
        legalName: data.legalName || undefined,
        taxId: data.taxId || undefined,
        country: data.country || undefined,
        legalEntityType: data.legalEntityType || undefined,
        fiscalAddress: data.fiscalAddress || undefined,
        paymentInfo: data.paymentInfo ? JSON.stringify(data.paymentInfo) : undefined,
        customFields: data.customFields ? (data.customFields as object[]) : undefined,
      },
    });

    if (data.initialTemplates && Array.isArray(data.initialTemplates) && data.initialTemplates.length > 0) {
      for (const tpl of data.initialTemplates) {
        if (!tpl.name || !tpl.name.trim()) continue;
        const code = tpl.code?.trim() || `COT-${slug.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        await this.prisma.quoteTemplate.create({
          data: {
            companyId: created.id,
            code,
            name: tpl.name.trim(),
            category: tpl.category?.trim() || 'General',
            projectData: (tpl.projectData as object) || { modalidad: 'Proyecto por alcance', plazo: '30 días calendario' },
            items: (tpl.items as object[]) || [],
            sections: tpl.sections ? (tpl.sections as object[]) : undefined,
            isCustom: true,
          },
        });
      }
    }

    return serialize(created);
  }

  async update(id: string, data: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const updateData: Record<string, unknown> = {
      name: data.name?.trim(),
      colorPrimary: data.colorPrimary,
      colorSecondary: data.colorSecondary,
      contactPhone: data.contactPhone,
      contactEmail: data.contactEmail,
      isActive: data.isActive,
      legalName: data.legalName,
      taxId: data.taxId,
      country: data.country,
      legalEntityType: data.legalEntityType,
      fiscalAddress: data.fiscalAddress,
      customFields: data.customFields,
    };

    if (data.slug !== undefined) {
      const slug = slugify(data.slug);
      if (!slug) throw new BadRequestException('El slug de la empresa no es válido');
      if (slug !== company.slug) {
        const existing = await this.prisma.company.findUnique({ where: { slug } });
        if (existing) throw new ConflictException(`Ya existe una empresa con el slug "${slug}"`);
      }
      updateData.slug = slug;
    }

    if (data.paymentInfo !== undefined) {
      // Se fusiona con lo existente para no perder llaves que otras personas ya guardaron
      // manualmente en este JSON (ej. Pyramid tiene ruc/direccion/web/detraccion además de banco/cuenta/cci).
      let existingPaymentInfo: Record<string, unknown> = {};
      if (company.paymentInfo) {
        try {
          existingPaymentInfo = JSON.parse(company.paymentInfo);
        } catch {
          existingPaymentInfo = {};
        }
      }
      updateData.paymentInfo = JSON.stringify({ ...existingPaymentInfo, ...data.paymentInfo });
    }

    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    const updated = await this.prisma.company.update({ where: { id }, data: updateData });
    return serialize(updated);
  }

  async uploadImages(id: string, files: Partial<Record<string, Express.Multer.File[]>>) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Empresa no encontrada');

    const entries = Object.entries(IMAGE_FIELD_TO_COLUMN).filter(([field]) => files[field]?.[0]);
    if (entries.length === 0) {
      throw new BadRequestException('No se recibió ninguna imagen');
    }

    const dir = path.join(process.cwd(), 'public', 'companies', company.slug);
    fs.mkdirSync(dir, { recursive: true });

    const updateData: Record<string, string> = {};
    for (const [field, column] of entries) {
      const file = files[field]![0];
      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException(`El archivo de "${field}" debe ser una imagen`);
      }
      if (file.size > MAX_IMAGE_BYTES) {
        throw new BadRequestException(`La imagen de "${field}" supera el tamaño máximo permitido (8 MB)`);
      }
      const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
      const filename = `${field}${ext}`;
      fs.writeFileSync(path.join(dir, filename), file.buffer);
      updateData[column] = `/companies/${company.slug}/${filename}`;
    }

    const updated = await this.prisma.company.update({ where: { id }, data: updateData });
    return serialize(updated);
  }
}
