import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuoteDto } from './dto/create-quote.dto';

@Injectable()
export class QuotesService {
  constructor(private prisma: PrismaService) {}

  private async generateQuoteNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = `${year}${month}-`;

    // Find the last quote from this month
    const lastQuote = await this.prisma.quote.findFirst({
      where: {
        number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastQuote) {
      return `${prefix}01`;
    }

    // Extract the sequence number and increment
    const lastSequence = parseInt(lastQuote.number.split('-')[1], 10);
    const nextSequence = String(lastSequence + 1).padStart(2, '0');
    return `${prefix}${nextSequence}`;
  }

  async create(createQuoteDto: CreateQuoteDto) {
    const {
      companyId, clientData, projectData, items, additionalItems, considerations, sections, images,
      ubicacionProyecto, sectorProyecto, tipoProyecto, tipoServicio, tipoCliente, clienteNuevoRecurrente, fuenteCliente, estado, metadata
    } = createQuoteDto;

    // Calculate totals
    const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
    const addonsTotal = (additionalItems || []).reduce((sum, item) => sum + item.total, 0);
    const subtotal = itemsTotal + addonsTotal;
    const igv = subtotal * 0.18;
    const total = subtotal + igv;

    const number = await this.generateQuoteNumber();

    return this.prisma.quote.create({
      data: {
        companyId,
        number,
        clientData: { ...clientData } as object,
        projectData: { ...projectData } as object,
        items: items.map(i => ({ ...i })) as object[],
        additionalItems: (additionalItems || []).map(i => ({ ...i })) as object[],
        subtotal,
        igv,
        total,
        considerations,
        sections: sections ? sections.map(s => ({ ...s })) as object[] : undefined,
        images: images || [],
        ubicacionProyecto,
        sectorProyecto,
        tipoProyecto,
        tipoServicio,
        tipoCliente,
        clienteNuevoRecurrente,
        fuenteCliente,
        estado: estado || 'borrador',
        metadata: metadata ? { ...metadata } as object : undefined,
      },
      include: {
        company: true,
      },
    });
  }

  async findAll(filters: any = {}) {
    const { companyId, search, estado, tipoServicio, from, to } = filters;

    const whereClause: any = {};
    if (companyId) whereClause.companyId = companyId;
    if (estado) whereClause.estado = estado;
    if (tipoServicio) whereClause.tipoServicio = tipoServicio;
    
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDate;
      }
    }

    const quotes = await this.prisma.quote.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
            colorPrimary: true,
            colorSecondary: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (search) {
      const s = search.toLowerCase();
      return quotes.filter(q => {
        const clientData: any = q.clientData || {};
        const projectData: any = q.projectData || {};
        return (
          q.number.toLowerCase().includes(s) ||
          (clientData.empresa && clientData.empresa.toLowerCase().includes(s)) ||
          (clientData.solicitante && clientData.solicitante.toLowerCase().includes(s)) ||
          (projectData.nombre && projectData.nombre.toLowerCase().includes(s))
        );
      });
    }

    return quotes;
  }

  async findOne(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }

  async update(id: string, updateData: any) {
    return this.prisma.quote.update({
      where: { id },
      data: updateData,
    });
  }
}
