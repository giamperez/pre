import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

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
}
