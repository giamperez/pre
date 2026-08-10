import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CatalogModule } from './catalog/catalog.module';
import { CompaniesModule } from './companies/companies.module';
import { LeadsModule } from './leads/leads.module';
import { QuotesModule } from './quotes/quotes.module';
import { TemplatesModule } from './templates/templates.module';
import { AuthModule } from './auth/auth.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { UsersModule } from './users/users.module';
import { BookingsModule } from './bookings/bookings.module';
import { MailModule } from './mail/mail.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { PrecotizadorChatModule } from './precotizador-chat/precotizador-chat.module';
import { ContractsModule } from './contracts/contracts.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public',
    }),
    PrismaModule,
    AuthModule,
    CatalogModule,
    CompaniesModule,
    MailModule,
    WhatsappModule,
    PrecotizadorChatModule,
    LeadsModule,
    QuotesModule,
    TemplatesModule,
    AnalyticsModule,
    UsersModule,
    BookingsModule,
    ContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
