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
    return this.prisma.quoteTemplate.create({
      data: {
        companyId: createTemplateDto.companyId,
        code: createTemplateDto.code,
        name: createTemplateDto.name,
        category: createTemplateDto.category,
        projectData: createTemplateDto.projectData as object,
        items: createTemplateDto.items as object[],
        sections: createTemplateDto.sections ? createTemplateDto.sections as object[] : undefined,
        isCustom: createTemplateDto.isCustom ?? true,
      },
    });
  }
}
