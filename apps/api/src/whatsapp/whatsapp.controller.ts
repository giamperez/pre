import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { WhatsappService } from './whatsapp.service';

@UseGuards(JwtAuthGuard)
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get(':companyId/status')
  getStatus(@Param('companyId') companyId: string) {
    return this.whatsappService.getStatus(companyId);
  }

  @UseGuards(RolesGuard)
  @Post(':companyId/connect')
  connect(@Param('companyId') companyId: string) {
    return this.whatsappService.connect(companyId);
  }

  @UseGuards(RolesGuard)
  @Post(':companyId/disconnect')
  disconnect(@Param('companyId') companyId: string) {
    return this.whatsappService.disconnect(companyId);
  }

  @Get(':companyId/chats')
  listChats(@Param('companyId') companyId: string) {
    return this.whatsappService.listChats(companyId);
  }

  @Get(':companyId/chats/:chatId/messages')
  getMessages(
    @Param('companyId') companyId: string,
    @Param('chatId') chatId: string,
    @Query('before') before?: string,
    @Query('limit') limit?: string,
  ) {
    return this.whatsappService.getMessages(companyId, chatId, before, limit ? Number(limit) : undefined);
  }

  @Post(':companyId/chats/:chatId/messages')
  sendMessage(
    @Param('companyId') companyId: string,
    @Param('chatId') chatId: string,
    @Body('text') text: string,
    @Req() req: any,
  ) {
    return this.whatsappService.sendMessage(companyId, chatId, text, req.user.userId);
  }
}
