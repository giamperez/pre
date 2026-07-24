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

    const config = company.availability.find(a => a.dayOfWeek === dayOfWeek && a.isActive);

    if (!config) {
      return [];
    }

    const start = parse(config.startTime, 'HH:mm', date);
    const end = parse(config.endTime, 'HH:mm', date);

    const bookings = await this.prisma.booking.findMany({
      where: {
        companyId: company.id,
        date: dateString,
        status: { not: 'cancelada' },
      },
    });

    const slots: { time: string; status: 'disponible' | 'ocupado' }[] = [];
    let current = start;

    const now = new Date();

    while (isBefore(addMinutes(current, config.slotMinutes - 1), end)) {
      const timeStr = format(current, 'HH:mm');
      
      let status: 'disponible' | 'ocupado' = 'disponible';
      
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
      
      const config = company.availability.find(a => a.dayOfWeek === dateObj.getDay() && a.isActive);
      
      if (!config) {
        summary.push({ date: dateStr, status: 'no-laboral' });
        continue;
      }

      // calculate total slots for this day
      const start = parse(config.startTime, 'HH:mm', dateObj);
      const end = parse(config.endTime, 'HH:mm', dateObj);
      
      let totalSlots = 0;
      let curr = start;
      while (isBefore(addMinutes(curr, config.slotMinutes - 1), end)) {
        totalSlots++;
        curr = addMinutes(curr, config.slotMinutes);
      }

      const bookedSlots = bookings.filter(b => b.date === dateStr).length;
      const freeSlots = totalSlots - bookedSlots;

      let status: 'disponible' | 'consultar' | 'ocupado' = 'disponible';
      if (freeSlots === 0) {
        status = 'ocupado';
      } else if (freeSlots <= 2) {
        status = 'consultar';
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
