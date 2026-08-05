import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappConnectionManager } from './whatsapp-connection.manager';
import { normalizeToWaJid } from './wa-number.util';

@Injectable()
export class WhatsappService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly connectionManager: WhatsappConnectionManager,
  ) {}

  async onModuleInit() {
    await this.connectionManager.restoreAllSessionsOnBoot();
  }

  async isConnected(companyId: string): Promise<boolean> {
    if (!this.connectionManager.isConnected(companyId)) return false;
    const session = await this.prisma.whatsAppSession.findUnique({ where: { companyId } });
    return session?.status === 'connected';
  }

  async getStatus(companyId: string) {
    const session = await this.prisma.whatsAppSession.findUnique({ where: { companyId } });
    return session ?? { companyId, status: 'disconnected' as const };
  }

  async connect(companyId: string) {
    await this.connectionManager.getOrCreateSocket(companyId);
    return this.getStatus(companyId);
  }

  async disconnect(companyId: string) {
    await this.connectionManager.disconnect(companyId);
    return this.getStatus(companyId);
  }

  async listChats(companyId: string) {
    return this.prisma.whatsAppChat.findMany({
      where: { companyId },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getMessages(companyId: string, chatId: string, before?: string, limit = 50) {
    const chat = await this.prisma.whatsAppChat.findFirst({ where: { id: chatId, companyId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    return this.prisma.whatsAppMessage.findMany({
      where: { chatId, ...(before ? { createdAt: { lt: new Date(before) } } : {}) },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async sendMessage(companyId: string, chatId: string, text: string, userId: string) {
    const chat = await this.prisma.whatsAppChat.findFirst({ where: { id: chatId, companyId } });
    if (!chat) throw new NotFoundException('Chat no encontrado');
    return this.connectionManager.sendMessage(companyId, chat.waJid, text, userId);
  }

  /** Usado por LeadsService: envía el resumen a un teléfono aunque todavía no exista un chat. */
  async sendToPhone(companyId: string, phone: string, text: string) {
    const waJid = normalizeToWaJid(phone);
    if (!waJid) throw new Error('Teléfono inválido');
    return this.connectionManager.sendMessage(companyId, waJid, text, null);
  }
}
