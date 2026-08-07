import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrecotizadorChatService {
  private readonly logger = new Logger(PrecotizadorChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateSession(companyId: string, sessionId?: string, customerInfo?: { name?: string; email?: string; phone?: string }) {
    if (sessionId) {
      const existing = await this.prisma.precotizadorChatSession.findUnique({
        where: { id: sessionId },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      });
      if (existing) return existing;
    }

    return this.prisma.precotizadorChatSession.create({
      data: {
        companyId,
        customerName: customerInfo?.name || 'Cliente Precotizador',
        customerEmail: customerInfo?.email,
        customerPhone: customerInfo?.phone,
        status: 'BOT_ACTIVE',
      },
      include: { messages: true },
    });
  }

  async processCustomerMessage(dto: { companyId: string; sessionId?: string; message: string; customerInfo?: any }) {
    const session = await this.getOrCreateSession(dto.companyId, dto.sessionId, dto.customerInfo);

    // Save user message
    await this.prisma.precotizadorChatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'user',
        senderName: session.customerName || 'Cliente',
        content: dto.message,
      },
    });

    // If human takeover is active, silently update unread count & lastMessageAt without sending bot auto-reply
    if (session.status === 'HUMAN_TAKEOVER') {
      await this.prisma.precotizadorChatSession.update({
        where: { id: session.id },
        data: {
          lastMessageAt: new Date(),
          unreadCountSales: { increment: 1 },
        },
      });

      return { session: await this.getSessionWithMessages(session.id), reply: null };
    }

    // Update lastMessageAt for active bot
    await this.prisma.precotizadorChatSession.update({
      where: { id: session.id },
      data: { lastMessageAt: new Date() },
    });

    // Check if customer explicitly requested a human advisor.
    // Only match clear intent phrases — a bare "asesor" substring was too broad
    // (e.g. "¿tienen asesores certificados?") and triggered an immediate handoff
    // even when the customer wasn't actually asking to be transferred.
    const lowerMessage = dto.message.toLowerCase();
    const isHumanRequest = [
      'hablar con un asesor',
      'hablar con un humano',
      'hablar con alguien',
      'persona real',
      'agente de ventas',
      'comunicarme con un asesor',
      'conectarme con un asesor',
      'quiero un asesor',
      'necesito un asesor',
      'pasame con un asesor',
      'pásame con un asesor',
      'contactar a un asesor',
    ].some(phrase => lowerMessage.includes(phrase));

    if (isHumanRequest) {
      await this.prisma.precotizadorChatSession.update({
        where: { id: session.id },
        data: {
          status: 'HUMAN_TAKEOVER',
          unreadCountSales: { increment: 1 },
        },
      });

      const replyText = '¡Entendido! Te estoy conectando con un asesor de ventas especializado. En breve responderán tus consultas por este medio.';
      const msg = await this.prisma.precotizadorChatMessage.create({
        data: {
          sessionId: session.id,
          sender: 'bot',
          senderName: 'Asistente Virtual',
          content: replyText,
          metadata: { isHumanTakeoverTriggered: true },
        },
      });
      return { session: await this.getSessionWithMessages(session.id), reply: msg };
    }

    // AI Bot Generation with DeepSeek / AI Engine + Catalog context
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
      include: { catalogItems: true },
    });

    if (!company) {
      throw new Error('Empresa no encontrada');
    }

    // Build chat history for context (last 6 messages = 3 turns, saves tokens)
    const recentMessagesDesc = await this.prisma.precotizadorChatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 6,
    });
    const recentMessages = recentMessagesDesc.reverse();

    const botResult = await this.generateAiResponse(company, recentMessages, dto.message);

    // Proactively offer a human advisor only once the bot has genuinely tried and
    // still hasn't reached a proposal after a few exchanges — never on the first
    // message. This is a soft suggestion (a chip the customer can accept), not an
    // automatic handoff like the explicit-request path above.
    const userTurnCount = recentMessages.filter(m => m.sender === 'user').length;
    const alreadyOffered = recentMessages.some(m => (m.metadata as any)?.offerAdvisor);
    const shouldOfferAdvisor = userTurnCount >= 3 && !alreadyOffered && !(botResult.metadata as any)?.isConfirmable;

    if (shouldOfferAdvisor) {
      botResult.replyText = `${botResult.replyText}\n\nSi prefieres, también puedo comunicarte con un asesor humano especializado para que te ayude directamente. 🙂`;
      botResult.metadata = {
        ...(botResult.metadata || {}),
        offerAdvisor: true,
      } as any;
    }

    // Save bot reply
    const botMsg = await this.prisma.precotizadorChatMessage.create({
      data: {
        sessionId: session.id,
        sender: 'bot',
        senderName: company.name.includes('Pyramid') ? 'Asistente Pyramid' : 'Asistente Vertex',
        content: botResult.replyText,
        metadata: (botResult.metadata as any) ?? undefined,
      },
    });

    if (botResult.analysisResult) {
      await this.prisma.precotizadorChatSession.update({
        where: { id: session.id },
        data: {
          analysisResult: botResult.analysisResult,
          summary: botResult.analysisResult.summary,
        },
      });
    }

    return { session: await this.getSessionWithMessages(session.id), reply: botMsg };
  }

  private async generateAiResponse(company: any, history: any[], currentMessage: string) {
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    const items = company.catalogItems || [];
    const mainServices = items.filter((i: any) => !i.isAddon);
    const addons = items.filter((i: any) => i.isAddon);

    // Fetch custom bot prompt from company's master precotización template if configured
    const prequoteTemplate = await this.prisma.quoteTemplate.findFirst({
      where: { companyId: company.id, type: 'precotizacion' },
    });
    const customBotPrompt = (prequoteTemplate?.cardsConfig as any)?.botPrompt;

    // Compact catalog representation to save tokens
    const catalogText = items.map((i: any) => `- [${i.id}] ${i.name} (${i.isAddon ? 'Addon' : 'Main'}): ${(i.description || '').slice(0, 80)}`).join('\n');

    const systemPrompt = `Asistente virtual de cotización para "${company.name}".
${customBotPrompt ? `PROMPT E INSTRUCCIONES ESPECÍFICAS DE LA EMPRESA:\n${customBotPrompt}\n` : ''}
Catálogo de Servicios:
${catalogText}

REGLAS OBLIGATORIAS:
1. Responde en español sencillo y amigable. Explica términos técnicos sin modismos complejos.
2. Si el cliente solo saluda, salúdalo y pregúntale sobre su proyecto (NO asumas servicios por defecto).
3. MENCIONA Y RECOMIENDA 2-3 Servicios Adicionales (addons) del catálogo que potencien su proyecto.
4. NUNCA menciones precios numéricos ni valores en dinero (S/ ni $).
5. Incluye IDs de addons recomendados en "agregadosIds".
6. Responde ÚNICAMENTE en JSON válido con este esquema:
{"respuesta":"Texto amigable al cliente...","proponerCotizacion":boolean,"servicioPrincipalId":"id-o-null","agregadosIds":["id1","id2"],"resumenProyecto":"Resumen breve","explicacionSencilla":"Por qué se eligió"}`;

    if (apiKey) {
      try {
        // Compress history message content to max 150 chars each to save tokens
        const messagesForApi = [
          { role: 'system', content: systemPrompt },
          ...history.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: (m.content || '').slice(0, 150),
          })),
        ];

        const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
        
        // 6-second timeout using AbortSignal to protect against lagging AI APIs
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(6000),
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messagesForApi,
            max_tokens: 350,
            temperature: 0.3,
            stream: false,
          }),
        });

        if (!response.ok) {
          throw new Error(`API HTTP ${response.status}: ${response.statusText}`);
        }

        const data = (await response.json()) as any;
        const rawContent = data?.choices?.[0]?.message?.content || '';
        const cleanContent = rawContent.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        // Resilient JSON Extraction
        let parsed: any = null;
        try {
          parsed = JSON.parse(cleanContent);
        } catch {
          const match = cleanContent.match(/\{[\s\S]*\}/);
          if (match) {
            try { parsed = JSON.parse(match[0]); } catch {}
          }
        }

        if (parsed) {
          return this.formatAiOutput(parsed, mainServices, addons);
        } else if (rawContent) {
          return {
            replyText: this.sanitizePriceText(rawContent),
            metadata: null,
            analysisResult: null,
          };
        }
      } catch (err: any) {
        this.logger.warn(`IA API Fallback/Error (${err.message}). Usando motor local de coincidencia.`);
      }
    }

    // Smart Fallback Engine with Catalog Matching
    return this.fallbackMatchEngine(company, mainServices, addons, currentMessage, history);
  }

  private sanitizePriceText(text: string): string {
    if (!text) return '';
    // Scrub any accidental price mentions (e.g. S/ 1,500, $1500, 1500 soles) to enforce price masking rules
    return text
      .replace(/(S\/\s*[\d,.]+|\$\s*[\d,.]+)/gi, '[monto visible al solicitar cotización]')
      .replace(/\b\d+\s*soles\b/gi, '[monto visible al solicitar cotización]');
  }

  private formatAiOutput(parsed: any, mainServices: any[], addons: any[]) {
    const mainService = mainServices.find(s => s.id === parsed.servicioPrincipalId || s.name.toLowerCase().includes((parsed.servicioPrincipalId || '').toLowerCase()));
    const validAddonIds = (parsed.agregadosIds || [])
      .map((id: string) => addons.find((a: any) => a.id === id || a.name.toLowerCase().includes(id.toLowerCase()))?.id)
      .filter(Boolean);

    const isConfirmable = Boolean(parsed.proponerCotizacion && mainService);
    const rawReply = parsed.respuesta || 'Con gusto te ayudo a cotizar. ¿Podrías darme más detalles de tu proyecto?';

    return {
      replyText: this.sanitizePriceText(rawReply),
      metadata: isConfirmable
        ? {
            isConfirmable: true,
            mainServiceId: mainService.id,
            mainServiceName: mainService.name,
            mainServicePrice: mainService.basePrice,
            addonIds: validAddonIds,
            summary: parsed.resumenProyecto || `Cotización personalizada para ${mainService.name}`,
            explanation: parsed.explicacionSencilla || `Elegimos ${mainService.name} porque se adapta perfectamente a tus requerimientos.`,
          }
        : null,
      analysisResult: isConfirmable
        ? {
            mainServiceId: mainService.id,
            mainServiceName: mainService.name,
            addonIds: validAddonIds,
            summary: parsed.resumenProyecto,
            explanation: parsed.explicacionSencilla,
          }
        : null,
    };
  }

  private fallbackMatchEngine(company: any, mainServices: any[], addons: any[], text: string, history: any[]) {
    const lower = text.toLowerCase().trim();
    const isGreeting = /^(hola|buenas|buenos dias|buenas tardes|hey|saludos)(!|\.|\s|$)/.test(lower);

    // Initial greeting check: Ask what they are looking for without forcing a default service
    if (isGreeting && history.length <= 2) {
      return {
        replyText: `¡Hola! 👋 Te doy la bienvenida a **${company.name}**. Estoy listo para ayudarte a encontrar la mejor opción para tu proyecto. ¿Qué tipo de servicio te gustaría realizar hoy?`,
        metadata: {
          suggestionChips: mainServices.slice(0, 3).map(s => s.name),
        },
      };
    }

    // Combine history text to retain multi-turn context across chat turns
    const fullHistoryText = (history.map((m: any) => m.content || '').join(' ') + ' ' + text).toLowerCase();

    // Try matching main services from current text or full history
    let matchedMain = mainServices.find(s => lower.includes(s.name.toLowerCase())) ||
                      mainServices.find(s => fullHistoryText.includes(s.name.toLowerCase()));

    if (!matchedMain) {
      if (fullHistoryText.includes('tienda') || fullHistoryText.includes('ecommerce') || fullHistoryText.includes('pago')) {
        matchedMain = mainServices.find(s => s.name.toLowerCase().includes('tienda') || s.name.toLowerCase().includes('e-commerce')) || mainServices[0];
      } else if (fullHistoryText.includes('web') || fullHistoryText.includes('pagina') || fullHistoryText.includes('landing')) {
        matchedMain = mainServices.find(s => s.name.toLowerCase().includes('landing') || s.name.toLowerCase().includes('web')) || mainServices[0];
      } else if (fullHistoryText.includes('app') || fullHistoryText.includes('movil') || fullHistoryText.includes('celular')) {
        matchedMain = mainServices.find(s => s.name.toLowerCase().includes('app') || s.name.toLowerCase().includes('software')) || mainServices[0];
      } else if (fullHistoryText.includes('estructural') || fullHistoryText.includes('plano') || fullHistoryText.includes('edificio') || fullHistoryText.includes('casa')) {
        matchedMain = mainServices.find(s => s.name.toLowerCase().includes('expediente') || s.name.toLowerCase().includes('estructuras')) || mainServices[0];
      } else if (fullHistoryText.includes('inspeccion') || fullHistoryText.includes('suelo') || fullHistoryText.includes('revis')) {
        matchedMain = mainServices.find(s => s.name.toLowerCase().includes('inspección') || s.name.toLowerCase().includes('revisión')) || mainServices[0];
      }
    }

    if (!matchedMain) {
      return {
        replyText: `Con mucho gusto puedo orientarte sobre las opciones de cotización en **${company.name}**. ¿Tienes alguna preferencia de proyecto o características que buscas?`,
        metadata: {
          suggestionChips: mainServices.slice(0, 3).map(s => s.name),
        },
      };
    }

    // Match addons from text or proactively recommend 2-3 top addons
    const matchedAddons: string[] = [];
    if (lower.includes('pago') || lower.includes('yape') || lower.includes('tarjeta')) {
      const a = addons.find((x: any) => x.name.toLowerCase().includes('pago'));
      if (a) matchedAddons.push(a.id);
    }
    if (lower.includes('factura') || lower.includes('boleta') || lower.includes('sunat')) {
      const a = addons.find((x: any) => x.name.toLowerCase().includes('facturación'));
      if (a) matchedAddons.push(a.id);
    }
    if (lower.includes('whatsapp') || lower.includes('bot')) {
      const a = addons.find((x: any) => x.name.toLowerCase().includes('whatsapp') || x.name.toLowerCase().includes('bot'));
      if (a) matchedAddons.push(a.id);
    }
    if (lower.includes('suelo') || lower.includes('calicata')) {
      const a = addons.find((x: any) => x.name.toLowerCase().includes('suelos'));
      if (a) matchedAddons.push(a.id);
    }

    // Proactively add 2 relevant additional services if user didn't request specific ones
    if (matchedAddons.length === 0 && addons.length > 0) {
      addons.slice(0, 2).forEach((a: any) => matchedAddons.push(a.id));
    }

    const matchedAddonObjs = addons.filter((a: any) => matchedAddons.includes(a.id));
    const addonNames = matchedAddonObjs.map((a: any) => a.name).join(', ');
    const addonListFormatted = matchedAddonObjs.map((a: any) => `• **${a.name}**: ${a.description || 'Complemento recomendado.'}`).join('\n');

    const plainExplanation = `Analicé tu solicitud para **${matchedMain.name}**.\n\n` +
      `• **¿En qué consiste el servicio principal?**: ${matchedMain.description || 'Incluye desarrollo y entrega completa según tus requerimientos.'}\n\n` +
      (matchedAddonObjs.length > 0 ? `• **Servicios Adicionales incluidos**: ${addonNames} para dejar tu proyecto 100% operativo y listo para usar.\n\n` : '') +
      `• **Beneficio directo**: Tendrás la garantía y respaldo técnico completo de ${company.name} sin complicaciones.`;

    const replyText = `¡Excelente! He analizado lo que necesitas para tu proyecto.\n\n` +
      `📌 **Servicio Principal**: **${matchedMain.name}**\n\n` +
      (matchedAddonObjs.length > 0 ? `💡 **Servicios Adicionales recomendados para complementar tu proyecto:**\n${addonListFormatted}\n\n` : '') +
      `¿Es esta la configuración que deseas cotizar para tu proyecto?`;

    return {
      replyText,
      metadata: {
        isConfirmable: true,
        mainServiceId: matchedMain.id,
        mainServiceName: matchedMain.name,
        mainServicePrice: matchedMain.basePrice,
        addonIds: matchedAddons,
        summary: `Cotización de ${matchedMain.name}` + (addonNames ? ` con Servicios Adicionales (${addonNames})` : ''),
        explanation: plainExplanation,
      },
      analysisResult: {
        mainServiceId: matchedMain.id,
        mainServiceName: matchedMain.name,
        addonIds: matchedAddons,
        summary: `Cotización de ${matchedMain.name}`,
        explanation: plainExplanation,
      },
    };
  }

  async getSessions(companyId?: string) {
    const where = companyId ? { companyId } : {};
    return this.prisma.precotizadorChatSession.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, slug: true, colorPrimary: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { lastMessageAt: 'desc' },
    });
  }

  async getSessionWithMessages(sessionId: string) {
    return this.prisma.precotizadorChatSession.findUnique({
      where: { id: sessionId },
      include: {
        company: {
          include: {
            catalogItems: true,
          },
        },
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async replyAsAgent(sessionId: string, agentName: string, agentId: string | undefined, content: string) {
    const current = await this.prisma.precotizadorChatSession.findUnique({ where: { id: sessionId } });

    await this.prisma.precotizadorChatSession.update({
      where: { id: sessionId },
      data: {
        status: 'HUMAN_TAKEOVER',
        assignedUserName: current?.assignedUserName || agentName || 'Asesor de Ventas',
        assignedUserId: current?.assignedUserId || agentId || null,
        unreadCountSales: 0,
        lastMessageAt: new Date(),
      },
    });

    const msg = await this.prisma.precotizadorChatMessage.create({
      data: {
        sessionId,
        sender: 'agent',
        senderName: agentName || 'Asesor de Ventas',
        content,
      },
    });

    return { message: msg, session: await this.getSessionWithMessages(sessionId) };
  }

  async getSalesAgents() {
    return this.prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: 'asc' },
    });
  }

  async transferSession(sessionId: string, targetAgentName?: string, targetAgentId?: string) {
    return this.prisma.precotizadorChatSession.update({
      where: { id: sessionId },
      data: {
        assignedUserName: targetAgentName || null,
        assignedUserId: targetAgentId || null,
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async closeSession(sessionId: string) {
    return this.prisma.precotizadorChatSession.update({
      where: { id: sessionId },
      data: {
        status: 'CLOSED',
      },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }

  async markRead(sessionId: string) {
    return this.prisma.precotizadorChatSession.update({
      where: { id: sessionId },
      data: {
        unreadCountSales: 0,
      },
    });
  }

  async toggleBotStatus(sessionId: string, status?: string) {
    const current = await this.prisma.precotizadorChatSession.findUnique({ where: { id: sessionId } });
    if (!current) throw new Error('Sesión no encontrada');

    const nextStatus = status || (current.status === 'BOT_ACTIVE' ? 'HUMAN_TAKEOVER' : 'BOT_ACTIVE');

    return this.prisma.precotizadorChatSession.update({
      where: { id: sessionId },
      data: { status: nextStatus },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
  }
}
