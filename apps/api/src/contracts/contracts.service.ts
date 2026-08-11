import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ContractPdfService } from './contract-pdf.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private contractPdfService: ContractPdfService,
  ) {}

  private async generateContractNumber(type: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const prefix = type === 'conformidad' ? `ACT-${year}${month}-` : `CON-${year}${month}-`;

    const lastContract = await this.prisma.contractDocument.findFirst({
      where: {
        number: {
          startsWith: prefix,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!lastContract) {
      return `${prefix}01`;
    }

    const lastSequence = parseInt(lastContract.number.split('-')[2] || '0', 10);
    const nextSequence = String(lastSequence + 1).padStart(2, '0');
    return `${prefix}${nextSequence}`;
  }

  private async recordAuditLog(
    contractId: string,
    action: string,
    description: string,
    user?: { id?: string; name?: string; email?: string },
    version?: string,
    metadata?: any,
  ) {
    try {
      await this.prisma.contractAuditLog.create({
        data: {
          contractId,
          action,
          description,
          userId: user?.id || null,
          userName: user?.name || null,
          userEmail: user?.email || null,
          version: version || '1.0',
          metadata: metadata || undefined,
        },
      });
    } catch (e) {
      console.error('Error al guardar log de auditoría del contrato:', e);
    }
  }

  async getAuditLogs(contractId: string) {
    await this.findOne(contractId); // ensure contract exists
    return this.prisma.contractAuditLog.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createFromQuote(quoteId: string, type: string = 'contrato', user?: any) {
    const quote = await this.prisma.quote.findUnique({
      where: { id: quoteId },
      include: { company: true },
    });

    if (!quote) {
      throw new NotFoundException('Cotización no encontrada');
    }

    const number = await this.generateContractNumber(type);
    const company = quote.company;

    const isConformity = type === 'conformidad';
    const title = isConformity
      ? `Acta de Conformidad de Servicio N° ${number}`
      : `Contrato de Prestación de Servicios N° ${number}`;

    const contentHtml = isConformity
      ? this.contractPdfService.getDefaultConformityHtml(quote, company)
      : this.contractPdfService.getDefaultContractHtml(quote, company);

    const contract = await this.prisma.contractDocument.create({
      data: {
        companyId: quote.companyId,
        quoteId: quote.id,
        type: isConformity ? 'conformidad' : 'contrato',
        number,
        title,
        version: '1.0',
        clientData: (quote.clientData || {}) as object,
        employerData: {
          name: company.name,
          legalName: company.legalName,
          taxId: company.taxId,
          fiscalAddress: company.fiscalAddress,
          contactPhone: company.contactPhone,
          contactEmail: company.contactEmail,
        } as object,
        servicesData: {
          projectData: quote.projectData,
          items: quote.items,
          subtotal: quote.subtotal,
          igv: quote.igv,
          total: quote.total,
        } as object,
        contentHtml,
        status: 'borrador',
        isLocked: false,
        totalAmount: quote.total,
      },
      include: {
        company: true,
        quote: true,
      },
    });

    await this.recordAuditLog(
      contract.id,
      'CREACION',
      `Documento ${title} v1.0 creado a partir de la Cotización N° ${quote.number}`,
      user,
      '1.0',
      { quoteId: quote.id, quoteNumber: quote.number },
    );

    return contract;
  }

  async findAll(filters: any = {}) {
    const { companyId, quoteId, type, status, search, from, to } = filters;
    const whereClause: any = {};

    if (companyId) whereClause.companyId = companyId;
    if (quoteId) whereClause.quoteId = quoteId;
    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    if (from || to) {
      whereClause.createdAt = {};
      if (from) whereClause.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        whereClause.createdAt.lte = toDate;
      }
    }

    const contracts = await this.prisma.contractDocument.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            logoUrl: true,
          },
        },
        quote: {
          select: {
            id: true,
            number: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (search) {
      const s = search.toLowerCase();
      return contracts.filter(c => {
        const client: any = c.clientData || {};
        return (
          c.number.toLowerCase().includes(s) ||
          c.title.toLowerCase().includes(s) ||
          (c.version && c.version.toLowerCase().includes(s)) ||
          (client.empresa && client.empresa.toLowerCase().includes(s)) ||
          (client.solicitante && client.solicitante.toLowerCase().includes(s))
        );
      });
    }

    return contracts;
  }

  async findOne(id: string) {
    const contract = await this.prisma.contractDocument.findUnique({
      where: { id },
      include: {
        company: true,
        quote: true,
        auditLogs: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException('Documento no encontrado');
    }

    return contract;
  }

  async update(id: string, updateData: any, user?: any) {
    const contract = await this.findOne(id);

    if (contract.isLocked) {
      throw new BadRequestException('Este documento ha sido emitido/firmado y está bloqueado contra modificaciones.');
    }

    const updated = await this.prisma.contractDocument.update({
      where: { id },
      data: {
        title: updateData.title !== undefined ? updateData.title : contract.title,
        contentHtml: updateData.contentHtml !== undefined ? updateData.contentHtml : contract.contentHtml,
        providerSignature: updateData.providerSignature !== undefined ? updateData.providerSignature : contract.providerSignature,
        clientSignature: updateData.clientSignature !== undefined ? updateData.clientSignature : contract.clientSignature,
        status: updateData.status !== undefined ? updateData.status : contract.status,
      },
      include: {
        company: true,
        quote: true,
      },
    });

    const isSigAdded =
      (updateData.providerSignature && !contract.providerSignature) ||
      (updateData.clientSignature && !contract.clientSignature);

    await this.recordAuditLog(
      id,
      isSigAdded ? 'FIRMA' : 'EDICION_TEXTO',
      isSigAdded
        ? `Se registró firma digital en el documento (v${contract.version || '1.0'})`
        : `Actualización de contenido en el borrador (v${contract.version || '1.0'})`,
      user,
      contract.version || '1.0',
    );

    return updated;
  }

  /**
   * Creates a new version (e.g., 1.0 -> 2.0 -> 3.0), unlocking the contract for further edits/addendums
   */
  async createNewVersion(id: string, user?: any) {
    const contract = await this.findOne(id);

    const currentMajor = parseInt(contract.version?.split('.')[0] || '1', 10);
    const nextVersion = `${currentMajor + 1}.0`;

    const updated = await this.prisma.contractDocument.update({
      where: { id },
      data: {
        version: nextVersion,
        isLocked: false,
        status: 'borrador',
      },
      include: {
        company: true,
        quote: true,
      },
    });

    await this.recordAuditLog(
      id,
      'NUEVA_VERSION',
      `Se generó la Versión v${nextVersion} del documento para revisiones y adenda (versión previa: v${contract.version})`,
      user,
      nextVersion,
      { previousVersion: contract.version, newVersion: nextVersion },
    );

    return updated;
  }

  /**
   * Finalizes, attaches signatures, locks against further modifications and saves persistent PDF to disk
   */
  async finalizeAndLock(id: string, lockData: { providerSignature?: string; clientSignature?: string; contentHtml?: string }, user?: any) {
    const contract = await this.findOne(id);

    const contentHtml = lockData.contentHtml || contract.contentHtml;
    const providerSignature = lockData.providerSignature || contract.providerSignature;
    const clientSignature = lockData.clientSignature || contract.clientSignature;

    const hasSignatures = Boolean(providerSignature || clientSignature);
    const finalStatus = hasSignatures ? 'firmado' : 'emitido';

    const updatedDraft = await this.prisma.contractDocument.update({
      where: { id },
      data: {
        contentHtml,
        providerSignature,
        clientSignature,
        status: finalStatus,
        isLocked: true,
      },
      include: {
        company: true,
        quote: true,
      },
    });

    // Generate & store persistent PDF file on server
    const { pdfPath } = await this.contractPdfService.generateAndSavePdf(updatedDraft);

    const result = await this.prisma.contractDocument.update({
      where: { id },
      data: { pdfPath },
      include: {
        company: true,
        quote: true,
      },
    });

    await this.recordAuditLog(
      id,
      'BLOQUEO_EMISION',
      `Documento finalizado y bloqueado con éxito en versión v${contract.version || '1.0'}. PDF almacenado en servidor.`,
      user,
      contract.version || '1.0',
      { pdfPath, status: finalStatus },
    );

    return result;
  }

  async getPdfBuffer(id: string, user?: any): Promise<Buffer> {
    const contract = await this.findOne(id);

    const { buffer } = await this.contractPdfService.generateAndSavePdf(contract);

    await this.recordAuditLog(
      id,
      'DESCARGA_PDF',
      `Visualización o descarga de PDF (v${contract.version || '1.0'})`,
      user,
      contract.version || '1.0',
    );

    return buffer;
  }

  async delete(id: string) {
    const contract = await this.findOne(id);
    return this.prisma.contractDocument.delete({
      where: { id },
    });
  }
}
