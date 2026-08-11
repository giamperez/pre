import { Controller, Get, Post, Param, Body, Res, Query, Patch, UseGuards, UseInterceptors, UploadedFile, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { QuotesService } from './quotes.service';
import { PdfService } from './pdf.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';
import * as xlsx from 'xlsx';

@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuotesController {
  constructor(
    private readonly quotesService: QuotesService,
    private readonly pdfService: PdfService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  create(@Body() createQuoteDto: CreateQuoteDto, @Req() req: Request) {
    return this.quotesService.create(createQuoteDto, (req as any).user);
  }

  @Get('audit-logs')
  getGlobalAuditLogs(@Query() query: any) {
    return this.quotesService.getGlobalAuditLogs(query);
  }

  @UseGuards(RolesGuard)
  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importQuotes(@UploadedFile() file: Express.Multer.File, @Req() req: Request) {
    if (!file) {
      return { importadas: 0, errores: 1, detalles: ['No se envió ningún archivo'] };
    }

    const pyramid = await this.prisma.company.findUnique({
      where: { slug: 'pyramid-structures' }
    });

    if (!pyramid) {
      return { importadas: 0, errores: 1, detalles: ['No se encontró la empresa Pyramid Structures en la BD'] };
    }

    const workbook = xlsx.read(file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = xlsx.utils.sheet_to_json(sheet);

    let procesadas = 0;
    let importadas = 0;
    let errores = 0;
    const detallesErrores: string[] = [];
    const currentUser = (req as any).user;

    for (const row of rows) {
      procesadas++;
      const codigo = row['Código de cotización'];

      if (!codigo) {
        continue;
      }

      try {
        let createdAt = new Date();
        if (row['Fecha de emisión']) {
           const rawDate = row['Fecha de emisión'];
           if (typeof rawDate === 'number') {
             createdAt = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
           } else {
             const parsed = new Date(rawDate);
             if (!isNaN(parsed.getTime())) {
               createdAt = parsed;
             }
           }
        }

        const clientData = {
          empresa: row['Cliente / razón social'] || '',
          ruc: row['RUC / DNI'] || '',
          solicitante: row['Solicitante'] || '',
          dni: row['DNI solicitante'] || '',
          telefono: row['Celular'] || '',
          correo: row['Correo'] || '',
          ciudad: row['Ciudad del cliente'] || '',
        };

        const projectData = {
          nombre: row['Nombre del proyecto'] || '',
          region: row['Región del proyecto'] || '',
          plazo: row['Plazo de ejecución'] || '',
        };

        const metadata = {
          descuento: row['Descuento aplicado'] || 0,
          motivoDescuento: row['Motivo del descuento'] || '',
          formaPago: row['Forma de pago'] || '',
          fechaEnvio: row['Fecha de envío'] || '',
          proyectoEstrategico: row['Proyecto estratégico'] || '',
          potencialFuturo: row['Potencial futuro del cliente'] || '',
          observaciones: row['Observaciones generales'] || '',
        };

        const companyId = pyramid.id;

        const subtotal = Number(row['Subtotal sin IGV']) || 0;
        const igv = Number(row['IGV']) || 0;
        const total = Number(row['Total con IGV']) || 0;

        const existing = await this.prisma.quote.findFirst({
          where: { number: codigo.toString(), companyId }
        });

        const data = {
          companyId,
          number: codigo.toString(),
          clientData,
          projectData,
          ubicacionProyecto: row['Ubicación del proyecto'] || '',
          sectorProyecto: row['Sector del proyecto'] || '',
          tipoProyecto: row['Tipo de proyecto'] || '',
          tipoServicio: row['Tipo de servicio principal'] || '',
          tipoCliente: row['Tipo de cliente'] || '',
          clienteNuevoRecurrente: row['Cliente nuevo/recurrente'] || '',
          fuenteCliente: row['Fuente del cliente'] || '',
          subtotal,
          igv,
          total,
          items: [],
          estado: 'aprobada',
          metadata,
          createdAt,
        };

        let savedQuote: any;
        if (existing) {
          savedQuote = await this.prisma.quote.update({
            where: { id: existing.id },
            data
          });
        } else {
          savedQuote = await this.prisma.quote.create({
            data
          });
        }

        await this.quotesService.recordAuditLog({
          quoteId: savedQuote.id,
          user: currentUser,
          action: 'IMPORTACION',
          description: `Cotización ${savedQuote.number} ${existing ? 'actualizada' : 'creada'} vía importación masiva en Excel.`,
          metadata: { total, clientEmpresa: clientData.empresa },
        });

        importadas++;
      } catch (error: any) {
        errores++;
        detallesErrores.push(`Fila ${procesadas} (${codigo}): ${error.message}`);
      }
    }

    return { importadas, errores, detalles: detallesErrores };
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
  async getPdf(@Param('id') id: string, @Req() req: Request, @Res() res: Response) {
    const quote = await this.quotesService.findOne(id);
    if (!quote) {
      res.status(404).send({ message: 'Quote not found' });
      return;
    }
    const pdfBuffer = await this.pdfService.generatePdf(quote);

    // Track audit log for PDF download/viewing
    await this.quotesService.recordAuditLog({
      quoteId: quote.id,
      user: (req as any).user,
      action: 'DESCARGA_PDF',
      description: `Documento PDF de la cotización ${quote.number} visualizado / generado.`,
    }).catch(() => {});

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="COTIZACION_${quote.number}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  }

  @Get(':id/audit-logs')
  getAuditLogsForQuote(@Param('id') id: string) {
    return this.quotesService.getAuditLogsForQuote(id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.quotesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    return this.quotesService.update(id, body, (req as any).user);
  }
}
