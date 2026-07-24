import { Controller, Get, Post, Param, Body, Res, Query, Patch, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { QuotesService } from './quotes.service';
import { PdfService } from './pdf.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
  ) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto) {
    return this.quotesService.create(createQuoteDto);
  }

  @Get()
  findAll(
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('estado') estado?: string,
    @Query('tipoServicio') tipoServicio?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.quotesService.findAll({ companyId, search, estado, tipoServicio, from, to });
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response) {
    const quote = await this.quotesService.findOne(id);
    if (!quote) {
      res.status(404).send({ message: 'Quote not found' });
      return;
    }
    const pdfBuffer = await this.pdfService.generatePdf(quote);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="COTIZACION_${quote.number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.quotesService.update(id, body);
  }
}
