import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { Company, Lead, WhatsAppSession } from '@prisma/client';
import { buildLeadSummaryEmail } from './templates/lead-summary.template';
import { buildDisconnectAlertEmail } from './templates/whatsapp-disconnect.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter(): nodemailer.Transporter | null {
    if (this.transporter) return this.transporter;
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn('SMTP no configurado (faltan SMTP_HOST/SMTP_USER/SMTP_PASS); correos deshabilitados');
      return null;
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return this.transporter;
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    const transporter = this.getTransporter();
    if (!transporter) return;
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || process.env.SMTP_USER,
        to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Error enviando correo a ${to}: ${err}`);
    }
  }

  async sendLeadSummary(lead: Lead, company: Company): Promise<void> {
    if (!lead.email) return;
    const { subject, html } = buildLeadSummaryEmail(lead, company);
    await this.send(lead.email, subject, html);
  }

  async sendWhatsappDisconnectAlert(company: Company, session: WhatsAppSession): Promise<void> {
    const alertTo = process.env.MAIL_ALERT_TO;
    if (!alertTo) return;
    const { subject, html } = buildDisconnectAlertEmail(company, session);
    await this.send(alertTo, subject, html);
  }
}
