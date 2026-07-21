import { IsString, IsOptional, IsArray, IsNumber, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class ClientDataDto {
  @IsString()
  empresa: string;

  @IsOptional()
  @IsString()
  ruc?: string;

  @IsString()
  solicitante: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  correo?: string;
}

class ProjectDataDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  modalidad?: string;

  @IsOptional()
  @IsString()
  plazo?: string;
}

class QuoteItemDto {
  @IsString()
  detalle: string;

  @IsNumber()
  cantidad: number;

  @IsNumber()
  precioUnitario: number;

  @IsNumber()
  total: number;
}

class QuoteSectionDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  enabled?: boolean;
}

export class CreateQuoteDto {
  @IsString()
  companyId: string;

  @IsObject()
  @ValidateNested()
  @Type(() => ClientDataDto)
  clientData: ClientDataDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ProjectDataDto)
  projectData: ProjectDataDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  items: QuoteItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteItemDto)
  additionalItems?: QuoteItemDto[];

  @IsOptional()
  @IsString()
  considerations?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuoteSectionDto)
  sections?: QuoteSectionDto[];

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsString()
  ubicacionProyecto?: string;

  @IsOptional()
  @IsString()
  sectorProyecto?: string;

  @IsOptional()
  @IsString()
  tipoProyecto?: string;

  @IsOptional()
  @IsString()
  tipoServicio?: string;

  @IsOptional()
  @IsString()
  tipoCliente?: string;

  @IsOptional()
  @IsString()
  clienteNuevoRecurrente?: string;

  @IsOptional()
  @IsString()
  fuenteCliente?: string;

  @IsOptional()
  @IsString()
  estado?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
