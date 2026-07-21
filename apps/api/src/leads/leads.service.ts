import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from './dto/create-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    return this.prisma.lead.create({
      data: createLeadDto,
    });
  }

  async findAll() {
    return this.prisma.lead.findMany({
      include: {
        company: {
          select: { name: true, colorPrimary: true },
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
