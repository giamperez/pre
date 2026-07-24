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

  async createBooking(data: { companySlug: string; clientName: string; clientEmail: string; clientPhone?: string; date: string; time: string; notes?: string }) {
    const company = await this.prisma.company.findUnique({
      where: { slug: data.companySlug },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Check availability
    const slots = await this.getDailyAvailability(data.companySlug, data.date);
    const slot = slots.find(s => s.time === data.time);
    
    if (!slot || slot.status === 'ocupado') {
      throw new BadRequestException('El horario seleccionado no está disponible.');
    }

    return this.prisma.booking.create({
      data: {
        companyId: company.id,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: data.date,
        time: data.time,
        notes: data.notes,
      },
    });
  }

  async getBookings(companyId: string) {
    return this.prisma.booking.findMany({
      where: { companyId },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' }
      ]
    });
  }

  async updateBookingStatus(id: string, status: string) {
    return this.prisma.booking.update({
      where: { id },
      data: { status },
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
