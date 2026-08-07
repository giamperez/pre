import { IsString, IsNotEmpty, IsOptional, IsObject, IsArray } from 'class-validator';

export class CreateInitialTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsObject()
  projectData?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  items?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  sections?: Array<Record<string, unknown>>;
}

export class CreateCompanyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsOptional()
  @IsString()
  colorPrimary?: string;

  @IsOptional()
  @IsString()
  colorSecondary?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  legalName?: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  legalEntityType?: string;

  @IsOptional()
  @IsString()
  fiscalAddress?: string;

  @IsOptional()
  @IsObject()
  paymentInfo?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  customFields?: Array<Record<string, unknown>>;

  @IsOptional()
  @IsArray()
  initialTemplates?: CreateInitialTemplateDto[];
}
