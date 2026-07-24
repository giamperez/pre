import { Controller, Get, Post, Patch, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // Public Endpoints
  @Get('bookings/availability/:companySlug')
  async getAvailability(
    @Param('companySlug') companySlug: string,
    @Query('date') date?: string,
    @Query('month') month?: string,
  ) {
    if (month) {
      return this.bookingsService.getMonthlySummary(companySlug, month);
    }
    if (date) {
      return this.bookingsService.getDailyAvailability(companySlug, date);
    }
    return [];
  }

  @Post('bookings')
  async createBooking(@Body() body: any) {
    return this.bookingsService.createBooking(body);
  }

  // Protected Endpoints
  @UseGuards(JwtAuthGuard)
  @Get('bookings')
  async getBookings(@Query('companyId') companyId: string) {
    return this.bookingsService.getBookings(companyId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bookings/:id')
  async updateBookingStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.bookingsService.updateBookingStatus(id, status);
  }

  @UseGuards(JwtAuthGuard)
  @Get('availability/config/:companySlug')
  async getConfig(@Param('companySlug') companySlug: string) {
    return this.bookingsService.getConfig(companySlug);
  }

  @UseGuards(JwtAuthGuard)
  @Put('availability/config/:companySlug')
  async updateConfig(@Param('companySlug') companySlug: string, @Body() body: any[]) {
    return this.bookingsService.updateConfig(companySlug, body);
  }
}
