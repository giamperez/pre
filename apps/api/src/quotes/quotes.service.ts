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
    const { companyId, clientData, projectData, items, additionalItems, considerations, images } = createQuoteDto;

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
        images: images || [],
      },
      include: {
        company: true,
      },
    });
  }

  async findAll() {
    return this.prisma.quote.findMany({
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
  }

  async findOne(id: string) {
    return this.prisma.quote.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });
  }
}
