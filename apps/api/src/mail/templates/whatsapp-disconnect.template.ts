import { Company, WhatsAppSession } from '@prisma/client';

export function buildDisconnectAlertEmail(company: Company, session: WhatsAppSession): { subject: string; html: string } {
  const primary = company.colorPrimary || '#0C2448';

  const html = `
    <div style="font-family:Arial, sans-serif; max-width:520px; margin:0 auto;">
      <div style="background:#dc2626; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">Sesión de WhatsApp desconectada</h1>
      </div>
      <div style="border:1px solid #e2e8f0; border-top:none; border-radius:0 0 12px 12px; padding:24px;">
        <p style="color:#334155; font-size:14px;">
          La sesión de WhatsApp de <strong style="color:${primary};">${company.name}</strong> se desconectó
          ${session.phoneNumber ? `(número ${session.phoneNumber})` : ''} y ya no puede enviar ni recibir mensajes.
        </p>
        ${session.disconnectReason ? `<p style="color:#64748b; font-size:13px;">Motivo: ${session.disconnectReason}</p>` : ''}
        <p style="color:#334155; font-size:14px; font-weight:600;">
          Un administrador debe volver a escanear el código QR desde el panel de WhatsApp en Cotizador para restablecer el servicio.
        </p>
        <p style="color:#64748b; font-size:13px; margin-top:16px;">
          Mientras tanto, los resúmenes de cotización se enviarán por correo en lugar de WhatsApp.
        </p>
      </div>
    </div>`;

  return {
    subject: `⚠ WhatsApp desconectado — ${company.name}`,
    html,
  };
}
