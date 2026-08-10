import { Module } from '@nestjs/common';
import { PrecotizadorChatController } from './precotizador-chat.controller';
import { PrecotizadorChatService } from './precotizador-chat.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PrecotizadorChatController],
  providers: [PrecotizadorChatService],
  exports: [PrecotizadorChatService],
})
export class PrecotizadorChatModule {}
