import { Company, Lead } from '@prisma/client';

function fmtMoney(n: number): string {
  return Number(n || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildLeadSummaryEmail(lead: Lead, company: Company): { subject: string; html: string } {
  const answers = (lead.answers as Record<string, any>) || {};
  const servicios: string[] = answers.serviciosPrincipales || [];
  const addons: string[] = answers.addons || [];
  const booking: { date: string; time: string } | undefined = answers.booking;
  const primary = company.colorPrimary || '#0C2448';

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:6px 0; color:#64748b; font-size:13px;">${label}</td>
      <td style="padding:6px 0; text-align:right; font-weight:600; color:#1e293b; font-size:13px;">${value}</td>
    </tr>`;

  const html = `
    <div style="font-family:Arial, sans-serif; max-width:520px; margin:0 auto;">
      <div style="background:${primary}; color:#fff; padding:20px 24px; border-radius:12px 12px 0 0;">
        <h1 style="margin:0; font-size:18px;">¡Gracias por tu cotización con ${company.name}!</h1>
      </div>
      <div style="border:1px solid #e2e8f0; border-top:none; border-radius:0 0 12px 12px; padding:24px;">
        <p style="color:#334155; font-size:14px;">Servicio principal: <strong>${servicios.join(', ') || '-'}</strong></p>
        <p style="color:#334155; font-size:14px;">Adicionales: <strong>${addons.length ? addons.join(', ') : 'Ninguno'}</strong></p>
        <table style="width:100%; border-collapse:collapse; margin-top:12px;">
          ${row('Subtotal', `PEN ${fmtMoney(answers.subtotal)}`)}
          ${row('IGV (18%)', `PEN ${fmtMoney(answers.igv)}`)}
          ${row('Total estimado', `PEN ${fmtMoney(answers.total)}`)}
        </table>
        ${booking ? `<p style="color:#334155; font-size:14px; margin-top:16px;">Reunión agendada: <strong>${booking.date} a las ${booking.time}</strong></p>` : ''}
        ${answers.detallesProyecto ? `<p style="color:#334155; font-size:14px;">Notas: ${answers.detallesProyecto}</p>` : ''}
        <p style="color:#64748b; font-size:13px; margin-top:20px;">Nos pondremos en contacto contigo pronto.</p>
      </div>
    </div>`;

  return {
    subject: `Resumen de tu cotización con ${company.name}`,
    html,
  };
}
