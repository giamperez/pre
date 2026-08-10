import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { PrecotizadorChatService } from './precotizador-chat.service';

@Controller('precotizador-chat')
export class PrecotizadorChatController {
  constructor(private readonly service: PrecotizadorChatService) {}

  @Post('message')
  async handleCustomerMessage(
    @Body() dto: { companyId: string; sessionId?: string; message: string; customerInfo?: any },
  ) {
    return this.service.processCustomerMessage(dto);
  }

  @Get('sessions')
  async getSessions(@Query('companyId') companyId?: string) {
    return this.service.getSessions(companyId);
  }

  @Get('sales-agents')
  async getSalesAgents() {
    return this.service.getSalesAgents();
  }

  @Get('sessions/:id')
  async getSession(@Param('id') id: string) {
    return this.service.getSessionWithMessages(id);
  }

  @Post('sessions/:id/reply')
  async replyAsAgent(
    @Param('id') id: string,
    @Body() body: { agentName: string; agentId?: string; content: string },
  ) {
    return this.service.replyAsAgent(id, body.agentName, body.agentId, body.content);
  }

  @Post('sessions/:id/transfer')
  async transferSession(
    @Param('id') id: string,
    @Body() body: { targetAgentName?: string; targetAgentId?: string },
  ) {
    return this.service.transferSession(id, body.targetAgentName, body.targetAgentId);
  }

  @Post('sessions/:id/close')
  async closeSession(@Param('id') id: string) {
    return this.service.closeSession(id);
  }

  @Post('sessions/:id/read')
  async markRead(@Param('id') id: string) {
    return this.service.markRead(id);
  }

  @Post('sessions/:id/toggle-bot')
  async toggleBotStatus(
    @Param('id') id: string,
    @Body() body: { status?: string },
  ) {
    return this.service.toggleBotStatus(id, body.status);
  }
}
