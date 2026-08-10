import { IsString, IsOptional, IsBoolean, IsObject, IsArray } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  companyId: string;

  @IsString()
  code: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsObject()
  projectData?: object;

  @IsOptional()
  @IsArray()
  items?: object[];

  @IsOptional()
  @IsArray()
  sections?: object[];

  @IsOptional()
  @IsObject()
  cardsConfig?: object;

  @IsOptional()
  @IsArray()
  customFields?: object[];

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}
