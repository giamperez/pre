import { Company, Lead } from '@prisma/client';

function fmtMoney(n: number): string {
  return Number(n || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildLeadSummaryText(lead: Lead, company: Company): string {
  const answers = (lead.answers as Record<string, any>) || {};
  const servicios: string[] = answers.serviciosPrincipales || [];
  const addons: string[] = answers.addons || [];
  const booking: { date: string; time: string } | undefined = answers.booking;

  const lines = [
    `¡Gracias por tu cotización con ${company.name}!`,
    '',
    `Servicio principal: ${servicios.join(', ') || '-'}`,
    `Adicionales: ${addons.length ? addons.join(', ') : 'Ninguno'}`,
    `Subtotal: PEN ${fmtMoney(answers.subtotal)}`,
    `IGV (18%): PEN ${fmtMoney(answers.igv)}`,
    `Total estimado: PEN ${fmtMoney(answers.total)}`,
  ];

  if (booking) {
    lines.push(`Reunión agendada: ${booking.date} a las ${booking.time}`);
  }
  if (answers.presupuestoEstimadoCliente) {
    lines.push(`Presupuesto indicado: ${answers.presupuestoEstimadoCliente}`);
  }
  if (answers.detallesProyecto) {
    lines.push(`Notas: ${answers.detallesProyecto}`);
  }

  lines.push('', 'Nos pondremos en contacto contigo pronto.');

  return lines.join('\n');
}
