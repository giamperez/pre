import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCompanies() {
    return this.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCatalogByCompany(companySlug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: {
        catalogItems: true,
      },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException('Empresa archivada o no disponible para precotización');
    }

    return company;
  }
}
