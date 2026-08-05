import { Module } from '@nestjs/common';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { MailModule } from '../mail/mail.module';
import { QuotesModule } from '../quotes/quotes.module';

@Module({
  imports: [WhatsappModule, MailModule, QuotesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
