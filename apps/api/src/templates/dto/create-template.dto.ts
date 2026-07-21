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

  @IsObject()
  projectData: object;

  @IsArray()
  items: object[];

  @IsOptional()
  @IsArray()
  sections?: object[];

  @IsOptional()
  @IsBoolean()
  isCustom?: boolean;
}
