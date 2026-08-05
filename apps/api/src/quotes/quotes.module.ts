import { Module } from '@nestjs/common';
import { QuotesController } from './quotes.controller';
import { QuotesService } from './quotes.service';
import { PdfService } from './pdf.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuotesController],
  providers: [QuotesService, PdfService],
  exports: [QuotesService],
})
export class QuotesModule {}
