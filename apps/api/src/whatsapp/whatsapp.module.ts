import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MailModule } from '../mail/mail.module';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { WhatsappConnectionManager } from './whatsapp-connection.manager';
import { WhatsappGateway } from './whatsapp.gateway';

@Module({
  imports: [AuthModule, MailModule],
  controllers: [WhatsappController],
  providers: [WhatsappService, WhatsappConnectionManager, WhatsappGateway],
  exports: [WhatsappService],
})
export class WhatsappModule {}
