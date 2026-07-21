import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { CatalogService } from './catalog.service';

@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get()
  async getCompanies() {
    return this.catalogService.getCompanies();
  }

  @Get(':companySlug')
  async getCatalogByCompany(@Param('companySlug') companySlug: string) {
    const catalog = await this.catalogService.getCatalogByCompany(companySlug);
    if (!catalog) {
      throw new NotFoundException('Company not found');
    }
    return catalog;
  }
}
