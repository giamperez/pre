import { Controller, Get, Post, Patch, Body, Param, UseGuards, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

const IMAGE_UPLOAD_FIELDS = [
  { name: 'logo', maxCount: 1 },
  { name: 'portada', maxCount: 1 },
  { name: 'contraportada', maxCount: 1 },
  { name: 'membrete', maxCount: 1 },
];

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @Post()
  create(@Body() createCompanyDto: CreateCompanyDto) {
    return this.companiesService.create(createCompanyDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCompanyDto: UpdateCompanyDto) {
    return this.companiesService.update(id, updateCompanyDto);
  }

  @Post(':id/images')
  @UseInterceptors(FileFieldsInterceptor(IMAGE_UPLOAD_FIELDS))
  uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Partial<Record<string, Express.Multer.File[]>>,
  ) {
    return this.companiesService.uploadImages(id, files);
  }
}
