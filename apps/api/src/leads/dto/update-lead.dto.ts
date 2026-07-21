import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadClassification } from '@prisma/client';

export class UpdateLeadDto {
  @IsOptional()
  @IsEnum(LeadClassification)
  classification?: LeadClassification;

  @IsOptional()
  @IsString()
  notes?: string;
}
