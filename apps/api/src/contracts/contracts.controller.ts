import { Controller, Get, Post, Param, Body, Res, Query, Patch, Delete, UseGuards, Req } from '@nestjs/common';
import type { Response } from 'express';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post('from-quote/:quoteId')
  createFromQuote(
    @Param('quoteId') quoteId: string,
    @Query('type') type?: string,
    @Req() req?: any,
  ) {
    return this.contractsService.createFromQuote(quoteId, type || 'contrato', req?.user);
  }

  @Get()
  findAll(@Query() query: any) {
    return this.contractsService.findAll(query);
  }

  @Get(':id/audit')
  getAuditLogs(@Param('id') id: string) {
    return this.contractsService.getAuditLogs(id);
  }

  @Post(':id/new-version')
  createNewVersion(@Param('id') id: string, @Req() req?: any) {
    return this.contractsService.createNewVersion(id, req?.user);
  }

  @Get(':id/pdf')
  async getPdf(@Param('id') id: string, @Res() res: Response, @Req() req?: any) {
    const contract = await this.contractsService.findOne(id);
    const pdfBuffer = await this.contractsService.getPdfBuffer(id, req?.user);

    const prefix = contract.type === 'conformidad' ? 'ACTA' : 'CONTRATO';
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${prefix}_${contract.number}_v${contract.version || '1.0'}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Post(':id/finalize')
  finalizeAndLock(@Param('id') id: string, @Body() body: any, @Req() req?: any) {
    return this.contractsService.finalizeAndLock(id, body, req?.user);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req?: any) {
    return this.contractsService.update(id, body, req?.user);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.contractsService.delete(id);
  }
}
