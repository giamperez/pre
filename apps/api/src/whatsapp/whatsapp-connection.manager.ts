import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Boom } from '@hapi/boom';
import makeWASocket, {
  DisconnectReason,
  MessageUpsertType,
  useMultiFileAuthState,
  WAMessage,
  WASocket,
} from '@whiskeysockets/baileys';
import * as QRCode from 'qrcode';
import { pino } from 'pino';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { WhatsappGateway } from './whatsapp.gateway';
import { waJidToDigits } from './wa-number.util';

const MAX_RECONNECT_ATTEMPTS = 1;

@Injectable()
export class WhatsappConnectionManager {
  private readonly logger = new Logger(WhatsappConnectionManager.name);
  private readonly sockets = new Map<string, WASocket>();
  private readonly reconnectAttempts = new Map<string, number>();
  private readonly sessionsRoot = path.join(
    process.cwd(),
    process.env.WHATSAPP_SESSIONS_DIR || 'whatsapp-sessions',
  );

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly gateway: WhatsappGateway,
  ) {}

  isConnected(companyId: string): boolean {
    return this.sockets.has(companyId);
  }

  async getOrCreateSocket(companyId: string): Promise<WASocket> {
    const existing = this.sockets.get(companyId);
    if (existing) return existing;

    const authDir = path.join(this.sessionsRoot, companyId);
    fs.mkdirSync(authDir, { recursive: true });
    const { state, saveCreds } = await useMultiFileAuthState(authDir);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger: pino({ level: 'silent' }) as any,
    });

    this.sockets.set(companyId, sock);

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (update) => this.handleConnectionUpdate(companyId, update));
    sock.ev.on('messages.upsert', (payload) => this.handleMessagesUpsert(companyId, payload));

    await this.upsertSession(companyId, { authDir: companyId, status: 'connecting' });

    return sock;
  }

  async sendMessage(companyId: string, waJid: string, text: string, userId: string | null) {
    const sock = this.sockets.get(companyId);
    if (!sock) {
      throw new Error(`No hay una sesión de WhatsApp conectada para la empresa ${companyId}`);
    }
    await sock.sendMessage(waJid, { text });

    const session = await this.prisma.whatsAppSession.findUnique({ where: { companyId } });
    if (!session) {
      throw new Error(`No existe WhatsAppSession para la empresa ${companyId}`);
    }

    const chat = await this.prisma.whatsAppChat.upsert({
      where: { sessionId_waJid: { sessionId: session.id, waJid } },
      update: { lastMessageAt: new Date(), lastMessagePreview: text.slice(0, 120) },
      create: {
        companyId,
        sessionId: session.id,
        waJid,
        lastMessageAt: new Date(),
        lastMessagePreview: text.slice(0, 120),
      },
    });

    const message = await this.prisma.whatsAppMessage.create({
      data: { chatId: chat.id, direction: 'out', body: text, sentByUserId: userId ?? undefined },
    });

    this.gateway.emitToCompany(companyId, 'whatsapp:message', { chat, message });
    return message;
  }

  async disconnect(companyId: string) {
    const sock = this.sockets.get(companyId);
    if (sock) {
      try {
        await sock.logout();
      } catch (err) {
        this.logger.warn(`Error al cerrar sesión de WhatsApp para ${companyId}: ${err}`);
      }
      this.sockets.delete(companyId);
    }
    fs.rmSync(path.join(this.sessionsRoot, companyId), { recursive: true, force: true });
    await this.upsertSession(companyId, {
      status: 'disconnected',
      qrCode: null,
      disconnectReason: 'manual_disconnect',
      lastDisconnectedAt: new Date(),
    });
  }

  async restoreAllSessionsOnBoot() {
    const sessions = await this.prisma.whatsAppSession.findMany({
      where: { authDir: { not: null }, status: { not: 'disconnected' } },
    });
    for (const session of sessions) {
      this.getOrCreateSocket(session.companyId).catch((err) =>
        this.logger.error(`No se pudo restaurar la sesión de WhatsApp de ${session.companyId}: ${err}`),
      );
    }
  }

  private async handleConnectionUpdate(companyId: string, update: Partial<{ connection: string; lastDisconnect: { error?: Error }; qr: string }>) {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrCode = await QRCode.toDataURL(qr);
      const session = await this.upsertSession(companyId, { status: 'qr_pending', qrCode });
      this.gateway.emitToCompany(companyId, 'whatsapp:qr', { qrCode });
      this.gateway.emitToCompany(companyId, 'whatsapp:status', session);
      return;
    }

    if (connection === 'open') {
      const sock = this.sockets.get(companyId);
      const phoneNumber = sock?.user?.id ? waJidToDigits(sock.user.id) : undefined;
      this.reconnectAttempts.delete(companyId);
      const session = await this.upsertSession(companyId, {
        status: 'connected',
        phoneNumber,
        qrCode: null,
        disconnectReason: null,
        lastConnectedAt: new Date(),
      });
      this.gateway.emitToCompany(companyId, 'whatsapp:status', session);
      return;
    }

    if (connection === 'close') {
      this.sockets.delete(companyId);
      const statusCode = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;

      if (!loggedOut) {
        const attempts = this.reconnectAttempts.get(companyId) || 0;
        if (attempts < MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts.set(companyId, attempts + 1);
          this.getOrCreateSocket(companyId).catch((err) =>
            this.logger.error(`Reintento de conexión de WhatsApp falló para ${companyId}: ${err}`),
          );
          return;
        }
      }

      this.reconnectAttempts.delete(companyId);
      // Las credenciales quedaron inválidas (sesión cerrada o reintentos agotados): las borramos
      // para que el próximo intento de conexión arranque de cero y Baileys emita un QR nuevo,
      // en vez de reintentar con credenciales muertas y fallar en silencio sin QR.
      fs.rmSync(path.join(this.sessionsRoot, companyId), { recursive: true, force: true });
      const session = await this.upsertSession(companyId, {
        status: 'disconnected',
        qrCode: null,
        disconnectReason: statusCode ? String(statusCode) : 'unknown',
        lastDisconnectedAt: new Date(),
      });
      this.gateway.emitToCompany(companyId, 'whatsapp:status', session);

      const company = await this.prisma.company.findUnique({ where: { id: companyId } });
      if (company) {
        this.mailService.sendWhatsappDisconnectAlert(company, session).catch((err) =>
          this.logger.error(`No se pudo enviar la alerta de desconexión de WhatsApp: ${err}`),
        );
      }
    }
  }

  private async handleMessagesUpsert(companyId: string, payload: { messages: WAMessage[]; type: MessageUpsertType }) {
    if (payload.type !== 'notify') return;
    for (const msg of payload.messages) {
      this.handleIncomingMessage(companyId, msg).catch((err) =>
        this.logger.error(`Error procesando mensaje entrante de WhatsApp: ${err}`),
      );
    }
  }

  private async handleIncomingMessage(companyId: string, msg: WAMessage) {
    const jid = msg.key.remoteJid;
    if (!jid || jid.endsWith('@g.us') || jid === 'status@broadcast') return;

    const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
    if (!text) return;

    const session = await this.prisma.whatsAppSession.findUnique({ where: { companyId } });
    if (!session) return;

    const direction = msg.key.fromMe ? 'out' : 'in';
    const digits = waJidToDigits(jid);
    let leadId: string | undefined;
    if (digits.length >= 9) {
      const lead = await this.prisma.lead.findFirst({
        where: { companyId, phone: { contains: digits.slice(-9) } },
        orderBy: { createdAt: 'desc' },
      });
      leadId = lead?.id;
    }

    const chat = await this.prisma.whatsAppChat.upsert({
      where: { sessionId_waJid: { sessionId: session.id, waJid: jid } },
      update: {
        contactName: msg.pushName || undefined,
        leadId,
        lastMessageAt: new Date(),
        lastMessagePreview: text.slice(0, 120),
        ...(direction === 'in' ? { unreadCount: { increment: 1 } } : {}),
      },
      create: {
        companyId,
        sessionId: session.id,
        waJid: jid,
        contactName: msg.pushName || undefined,
        leadId,
        lastMessageAt: new Date(),
        lastMessagePreview: text.slice(0, 120),
        unreadCount: direction === 'in' ? 1 : 0,
      },
    });

    const message = await this.prisma.whatsAppMessage.upsert({
      where: { chatId_waMessageId: { chatId: chat.id, waMessageId: msg.key.id || `no-id-${Date.now()}` } },
      update: {},
      create: {
        chatId: chat.id,
        waMessageId: msg.key.id,
        direction,
        body: text,
      },
    });

    this.gateway.emitToCompany(companyId, 'whatsapp:message', { chat, message });
  }

  private async upsertSession(companyId: string, data: Record<string, unknown>) {
    return this.prisma.whatsAppSession.upsert({
      where: { companyId },
      update: data,
      create: { companyId, ...data },
    });
  }
}
