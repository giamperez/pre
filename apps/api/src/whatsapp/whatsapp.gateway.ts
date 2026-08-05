import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/ws/whatsapp', cors: { origin: '*' } })
export class WhatsappGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(WhatsappGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const { companyId, token } = (client.handshake.auth || {}) as { companyId?: string; token?: string };
    if (!companyId || !token) {
      client.disconnect();
      return;
    }
    try {
      this.jwtService.verify(token, { secret: process.env.JWT_SECRET || 'vertex-comercial-jwt-secret-2026' });
      client.join(`company:${companyId}`);
    } catch {
      this.logger.warn(`Conexión websocket rechazada (token inválido) para companyId=${companyId}`);
      client.disconnect();
    }
  }

  emitToCompany(companyId: string, event: string, payload: unknown) {
    this.server?.to(`company:${companyId}`).emit(event, payload);
  }
}
