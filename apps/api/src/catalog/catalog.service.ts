import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogService {
  constructor(private prisma: PrismaService) {}

  async getCompanies() {
    return this.prisma.company.findMany();
  }

  async getCatalogByCompany(companySlug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: {
        catalogItems: true,
      },
    });

    return company;
  }
}
