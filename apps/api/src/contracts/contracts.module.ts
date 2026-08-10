import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractPdfService } from './contract-pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContractsController],
  providers: [ContractsService, ContractPdfService],
  exports: [ContractsService, ContractPdfService],
})
export class ContractsModule {}
