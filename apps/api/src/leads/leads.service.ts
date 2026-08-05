import { Injectable, Logger } from '@nestjs/common';
import { Company, Lead } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { MailService } from '../mail/mail.service';
import { QuotesService } from '../quotes/quotes.service';
import { buildLeadSummaryText } from './lead-summary.util';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  private readonly logger = new Logger(LeadsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsappService: WhatsappService,
    private mailService: MailService,
    private quotesService: QuotesService,
  ) {}

  async create(createLeadDto: CreateLeadDto) {
    const lead = await this.prisma.lead.create({
      data: createLeadDto,
      include: { company: true },
    });

    this.notifyLeadSummary(lead).catch((err) =>
      this.logger.error(`No se pudo enviar el resumen de cotización al lead ${lead.id}: ${err}`),
    );

    return lead;
  }



  private async notifyLeadSummary(lead: Lead & { company: Company }) {
    if (lead.phone && (await this.whatsappService.isConnected(lead.companyId))) {
      await this.whatsappService.sendToPhone(lead.companyId, lead.phone, buildLeadSummaryText(lead, lead.company));
      return;
    }
    if (lead.email) {
      await this.mailService.sendLeadSummary(lead, lead.company);
    }
  }

  async findAll() {
    return this.prisma.lead.findMany({
      include: {
        company: {
          select: { name: true, colorPrimary: true, slug: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.lead.findUnique({
      where: { id },
      include: {
        company: {
          select: { name: true, colorPrimary: true, slug: true },
        },
      },
    });
  }

  async update(id: string, updateLeadDto: any) {
    return this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }
}
