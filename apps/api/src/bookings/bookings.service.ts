import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { parse, addMinutes, format, isBefore, isSameDay } from 'date-fns';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDailyAvailability(companySlug: string, dateString: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: { availability: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    const date = new Date(`${dateString}T00:00:00`);
    const dayOfWeek = date.getDay();

    const configs = company.availability.filter(a => a.dayOfWeek === dayOfWeek && a.isActive);

    if (configs.length === 0) {
      return [];
    }

    const bookings = await this.prisma.booking.findMany({
      where: {
        companyId: company.id,
        date: dateString,
        status: { not: 'cancelada' },
      },
    });

    const slots: { time: string; status: 'disponible' | 'consultar' | 'ocupado' }[] = [];
    const now = new Date();

    for (const config of configs) {
      const start = parse(config.startTime, 'HH:mm', date);
      const end = parse(config.endTime, 'HH:mm', date);
      let current = start;

      while (isBefore(addMinutes(current, config.slotMinutes - 1), end)) {
        const timeStr = format(current, 'HH:mm');
        
        let status: 'disponible' | 'consultar' | 'ocupado' = config.type as 'disponible' | 'consultar';
        
        if (isSameDay(date, now) && isBefore(current, now)) {
          status = 'ocupado';
        } else if (bookings.some(b => b.time === timeStr)) {
          status = 'ocupado';
        }

        slots.push({
          time: timeStr,
          status,
        });

        current = addMinutes(current, config.slotMinutes);
      }
    }

    slots.sort((a, b) => a.time.localeCompare(b.time));
    return slots;
  }

  async getMonthlySummary(companySlug: string, monthPrefix: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: { availability: true },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // monthPrefix is "YYYY-MM"
    const bookings = await this.prisma.booking.findMany({
      where: {
        companyId: company.id,
        date: { startsWith: monthPrefix },
        status: { not: 'cancelada' },
      },
    });

    const summary: { date: string; status: 'disponible' | 'consultar' | 'ocupado' | 'no-laboral' }[] = [];

    // Check all days in the month
    const [year, month] = monthPrefix.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dateObj = new Date(`${dateStr}T00:00:00`);
      
      const configs = company.availability.filter(a => a.dayOfWeek === dateObj.getDay() && a.isActive);
      
      if (configs.length === 0) {
        summary.push({ date: dateStr, status: 'no-laboral' });
        continue;
      }

      let hasDisponible = false;
      let hasConsultar = false;
      let allOccupied = true;
      
      for (const config of configs) {
        const start = parse(config.startTime, 'HH:mm', dateObj);
        const end = parse(config.endTime, 'HH:mm', dateObj);
        
        let curr = start;
        while (isBefore(addMinutes(curr, config.slotMinutes - 1), end)) {
          const timeStr = format(curr, 'HH:mm');
          const isOccupied = bookings.some(b => b.date === dateStr && b.time === timeStr);
          
          if (!isOccupied) {
            allOccupied = false;
            if (config.type === 'disponible') hasDisponible = true;
            if (config.type === 'consultar') hasConsultar = true;
          }
          
          curr = addMinutes(curr, config.slotMinutes);
        }
      }

      let status: 'disponible' | 'consultar' | 'ocupado' = 'ocupado';
      if (!allOccupied) {
        if (hasDisponible) {
          status = 'disponible';
        } else if (hasConsultar) {
          status = 'consultar';
        }
      }

      summary.push({ date: dateStr, status });
    }

    return summary;
  }

  async createBooking(data: {
    companySlug?: string;
    companyId?: string;
    leadId?: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    date?: string;
    time?: string;
    notes?: string;
  }) {
    let company: any = null;

    if (data.companyId) {
      company = await this.prisma.company.findUnique({ where: { id: data.companyId } });
    } else if (data.companySlug) {
      company = await this.prisma.company.findUnique({ where: { slug: data.companySlug } });
    }

    if (!company) {
      company = await this.prisma.company.findFirst({ where: { isActive: true } });
    }

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    // Default Date fallback to tomorrow if missing
    let targetDate = data.date;
    if (!targetDate || targetDate.trim() === '') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      // Skip Sunday
      if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1);
      const year = tomorrow.getFullYear();
      const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
      const day = String(tomorrow.getDate()).padStart(2, '0');
      targetDate = `${year}-${month}-${day}`;
    }

    // Default Time fallback to 10:00 if missing
    let targetTime = data.time && data.time.trim() !== '' ? data.time : '10:00';

    // Verify slot conflicts and find next available time if taken
    const existing = await this.prisma.booking.findFirst({
      where: {
        companyId: company.id,
        date: targetDate,
        time: targetTime,
        status: { not: 'cancelada' },
      },
    });

    if (existing) {
      const defaultTimes = ['10:00', '10:30', '11:00', '11:30', '14:00', '15:00', '16:00', '17:00'];
      for (const t of defaultTimes) {
        const check = await this.prisma.booking.findFirst({
          where: { companyId: company.id, date: targetDate, time: t, status: { not: 'cancelada' } },
        });
        if (!check) {
          targetTime = t;
          break;
        }
      }
    }

    return this.prisma.booking.create({
      data: {
        companyId: company.id,
        leadId: data.leadId || undefined,
        clientName: data.clientName || 'Cliente Precotizador',
        clientEmail: data.clientEmail || 'cliente@ejemplo.com',
        clientPhone: data.clientPhone || undefined,
        date: targetDate,
        time: targetTime,
        status: 'pendiente',
        notes: data.notes || 'Reunión agendada desde precotización',
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
      },
    });
  }

  async getBookings(companyId?: string) {
    const whereClause: any = {};
    if (companyId && companyId !== 'all' && companyId.trim() !== '') {
      whereClause.companyId = companyId;
    }

    return this.prisma.booking.findMany({
      where: whereClause,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
  }

  async updateBookingStatus(id: string, status: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            slug: true,
            colorPrimary: true,
          },
        },
      },
    });
  }

  async deleteBooking(id: string) {
    return this.prisma.booking.delete({
      where: { id },
    });
  }

  async getConfig(companySlug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
      include: { availability: true },
    });
    if (!company) throw new NotFoundException();
    return company.availability;
  }

  async updateConfig(companySlug: string, availabilityData: any[]) {
    const company = await this.prisma.company.findUnique({
      where: { slug: companySlug },
    });
    if (!company) throw new NotFoundException();

    // delete old ones and insert new
    await this.prisma.availability.deleteMany({
      where: { companyId: company.id }
    });

    return this.prisma.availability.createMany({
      data: availabilityData.map(a => ({
        ...a,
        companyId: company.id
      }))
    });
  }
}
