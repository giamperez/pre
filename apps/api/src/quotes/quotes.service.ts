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

  async recordAuditLog(data: {
    quoteId: string;
    user?: { userId?: string; name?: string; email?: string };
    action: string;
    description: string;
    metadata?: any;
  }) {
    return this.prisma.quoteAuditLog.create({
      data: {
        quoteId: data.quoteId,
        userId: data.user?.userId || null,
        userName: data.user?.name || null,
        userEmail: data.user?.email || null,
        action: data.action,
        description: data.description,
        metadata: data.metadata || undefined,
      },
    });
  }

  async create(createQuoteDto: CreateQuoteDto, user?: any) {
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

    const createdQuote = await this.prisma.quote.create({
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

    const clientEmpresa = (clientData as any)?.empresa || '';
    await this.recordAuditLog({
      quoteId: createdQuote.id,
      user,
      action: 'CREACION',
      description: `Cotización ${createdQuote.number} creada${clientEmpresa ? ` para ${clientEmpresa}` : ''} por un total de S/ ${total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}.`,
      metadata: {
        total,
        estado: createdQuote.estado,
        clientEmpresa,
      },
    });

    return createdQuote;
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

  async update(id: string, updateData: any, user?: any) {
    const previous = await this.findOne(id);
    const dataToUpdate = { ...updateData };

    if (dataToUpdate.items !== undefined || dataToUpdate.additionalItems !== undefined) {
      const items = dataToUpdate.items || [];
      const additionalItems = dataToUpdate.additionalItems || [];
      const itemsTotal = items.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
      const addonsTotal = additionalItems.reduce((sum: number, item: any) => sum + (Number(item.total) || 0), 0);
      dataToUpdate.subtotal = itemsTotal + addonsTotal;
      dataToUpdate.igv = dataToUpdate.subtotal * 0.18;
      dataToUpdate.total = dataToUpdate.subtotal + dataToUpdate.igv;
    }

    const updated = await this.prisma.quote.update({
      where: { id },
      data: dataToUpdate,
      include: {
        company: true,
      },
    });

    if (previous) {
      const isStatusOnlyChange = Object.keys(dataToUpdate).length === 1 && dataToUpdate.estado;
      if (previous.estado !== updated.estado) {
        await this.recordAuditLog({
          quoteId: id,
          user,
          action: 'CAMBIO_ESTADO',
          description: `Estado actualizado de "${previous.estado}" a "${updated.estado}".`,
          metadata: {
            estadoAnterior: previous.estado,
            estadoNuevo: updated.estado,
          },
        });
      }

      if (!isStatusOnlyChange) {
        const totalChanged = Math.abs(previous.total - updated.total) > 0.01;
        let desc = `Cotización ${updated.number} modificada.`;
        if (totalChanged) {
          desc += ` Total cambió de S/ ${previous.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })} a S/ ${updated.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}.`;
        }

        await this.recordAuditLog({
          quoteId: id,
          user,
          action: 'EDICION',
          description: desc,
          metadata: {
            totalAnterior: previous.total,
            totalNuevo: updated.total,
            camposActualizados: Object.keys(dataToUpdate),
          },
        });
      }
    }

    return updated;
  }

  async getAuditLogsForQuote(quoteId: string) {
    return this.prisma.quoteAuditLog.findMany({
      where: { quoteId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGlobalAuditLogs(filters: any = {}) {
    const { quoteId, action, search, from, to } = filters;
    const whereClause: any = {};
    if (quoteId) whereClause.quoteId = quoteId;
    if (action) whereClause.action = action;
    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDate;
      }
    }

    const logs = await this.prisma.quoteAuditLog.findMany({
      where: whereClause,
      include: {
        quote: {
          select: {
            id: true,
            number: true,
            total: true,
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 200,
    });

    if (search) {
      const s = search.toLowerCase();
      return logs.filter((log) => {
        return (
          log.description.toLowerCase().includes(s) ||
          (log.userName && log.userName.toLowerCase().includes(s)) ||
          (log.userEmail && log.userEmail.toLowerCase().includes(s)) ||
          (log.quote?.number && log.quote.number.toLowerCase().includes(s))
        );
      });
    }

    return logs;
  }
}
