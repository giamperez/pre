import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

@Injectable()
export class ContractPdfService {
  private ensureUploadDir(): string {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'contracts');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    return uploadDir;
  }

  private fmtCurrency(n: number): string {
    return Number(n || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatDate(dateInput?: Date | string | null): string {
    const d = dateInput ? new Date(dateInput) : new Date();
    return d.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  }

  /**
   * Generates default HTML template for CONTRATO DE PRESTACION DE SERVICIOS
   * Based on the 6-page legal agreement template
   */
  getDefaultContractHtml(quote: any, company: any): string {
    const clientData = quote?.clientData || {};
    const projectData = quote?.projectData || {};
    const items: any[] = quote?.items || [];
    const total = quote?.total || 0;

    const companyName = company?.legalName || company?.name || 'LA EMPRESA';
    const companyTaxId = company?.taxId || 'RUC N° ____________';
    const companyAddress = company?.fiscalAddress || 'Ciudad';
    const clientCompany = clientData.empresa || 'EL CLIENTE';
    const clientTaxId = clientData.ruc || 'RUC / DNI ____________';
    const clientContact = clientData.solicitante || 'Representante Legal';

    const itemsListHtml = items.map((item, idx) => `
      <tr>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${idx + 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1;"><strong>${item.titulo || item.detalle}</strong><br/><small style="color: #64748b;">${item.contenido || ''}</small></td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">${item.cantidad || 1}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">S/ ${this.fmtCurrency(item.precioUnitario)}</td>
        <td style="padding: 8px; border: 1px solid #cbd5e1; text-align: right; font-weight: bold;">S/ ${this.fmtCurrency(item.total)}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <h1 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; color: #0f172a;">
          CONTRATO DE PRESTACIÓN DE SERVICIOS Y DESARROLLO
        </h1>

        <p style="text-align: justify; margin-bottom: 16px;">
          Conste por el presente documento el <strong>Contrato de Prestación de Servicios Profesionales</strong> que celebran de una parte
          <strong>${companyName}</strong>, identificada con ${companyTaxId}, con domicilio fiscal en ${companyAddress}, a quien en adelante se le denominará <strong>EL PROVEEDOR</strong>;
          y de la otra parte <strong>${clientCompany}</strong>, identificada con ${clientTaxId}, representada por <strong>${clientContact}</strong>, a quien en adelante se le denominará <strong>EL CLIENTE</strong>;
          en los términos y condiciones siguientes:
        </p>

        <h2 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          DECLARACIONES
        </h2>

        <p style="margin-bottom: 8px;"><strong>1. Declara EL PROVEEDOR:</strong></p>
        <ul style="margin-top: 4px; margin-bottom: 16px; padding-left: 24px;">
          <li>Que es una empresa legalmente constituida con capacidad técnica, profesional y humana para desarrollar el proyecto encomendado.</li>
          <li>Que cuenta con la infraestructura y recursos necesarios para la ejecución oportuna de los servicios acordados.</li>
        </ul>

        <p style="margin-bottom: 8px;"><strong>2. Declara EL CLIENTE:</strong></p>
        <ul style="margin-top: 4px; margin-bottom: 16px; padding-left: 24px;">
          <li>Que requiere la contratación de los servicios especificados para el proyecto <strong>"${projectData.nombre || 'Proyecto Comercial'}"</strong>.</li>
          <li>Que cuenta con las facultades legales para la suscripción del presente contrato y el cumplimiento de las obligaciones de pago.</li>
        </ul>

        <h2 style="font-size: 14px; font-weight: bold; margin-top: 20px; margin-bottom: 8px; color: #1e293b; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
          CLÁUSULAS DEL CONTRATO
        </h2>

        <p><strong>PRIMERA.- OBJETO DEL CONTRATO:</strong></p>
        <p style="text-align: justify; margin-bottom: 12px;">
          EL PROVEEDOR se obliga a prestar a favor de EL CLIENTE los servicios profesionales de desarrollo, diseño y ejecución del proyecto <strong>"${projectData.nombre || 'Servicio Profesional'}"</strong>, comprendiendo los entregables e ítems detallados a continuación:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 20px; font-size: 12px;">
          <thead>
            <tr style="background-color: #f1f5f9; color: #334155;">
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Item</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: left;">Descripción de Entregable</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: center;">Cant.</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">P. Unit.</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <p><strong>SEGUNDA.- PRECIO Y FORMA DE PAGO:</strong></p>
        <p style="text-align: justify; margin-bottom: 12px;">
          El precio total acordado por la prestación de los servicios asciende a la suma de <strong>S/ ${this.fmtCurrency(total)} (Incluye IGV)</strong>, la cual será abonada por EL CLIENTE conforme a la propuesta comercial aprobada mediante la cotización N° <strong>${quote?.number || 'COT-001'}</strong>.
        </p>

        <p><strong>TERCERA.- PLAZO Y ENTREGAS:</strong></p>
        <p style="text-align: justify; margin-bottom: 12px;">
          El plazo estimado para la ejecución total del servicio es de <strong>${projectData.plazo || '30 días hábiles'}</strong>, contados a partir de la firma del presente contrato y la entrega de los insumos requeridos por parte de EL CLIENTE.
        </p>

        <p><strong>CUARTA.- CONFIDENCIALIDAD:</strong></p>
        <p style="text-align: justify; margin-bottom: 12px;">
          Ambas partes se comprometen a guardar la más estricta reserva y confidencialidad respecto a toda la información sensible, datos de negocio o documentación compartida en el marco de la ejecución del presente contrato.
        </p>

        <p style="margin-top: 24px;">
          En señal de conformidad con todas las cláusulas expuestas, las partes suscriben el presente contrato en dos ejemplares de igual valor legal, en la fecha <strong>${this.formatDate()}</strong>.
        </p>
      </div>
    `;
  }

  /**
   * Generates default HTML template for ACTA DE CONFORMIDAD DE SERVICIO
   * Based on the official acceptance document image
   */
  getDefaultConformityHtml(quote: any, company: any): string {
    const clientData = quote?.clientData || {};
    const projectData = quote?.projectData || {};
    const items: any[] = quote?.items || [];

    const companyName = company?.legalName || company?.name || 'LA EMPRESA';
    const clientCompany = clientData.empresa || 'EL CLIENTE';
    const clientContact = clientData.solicitante || 'Representante';

    const itemsSummary = items.map(i => i.titulo || i.detalle).join(', ');

    return `
      <div style="font-family: 'Helvetica', 'Arial', sans-serif; font-size: 13px; line-height: 1.6; color: #1e293b;">
        <h1 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 24px; text-transform: uppercase; color: #0f172a; border-bottom: 2px solid #0f172a; padding-bottom: 8px;">
          ACTA DE CONFORMIDAD DEL SERVICIO
        </h1>

        <p style="text-align: justify; margin-bottom: 16px;">
          En la ciudad de Lima, con fecha <strong>${this.formatDate()}</strong>, se constituye la representación de <strong>${clientCompany}</strong>, representada por <strong>${clientContact}</strong>, con el fin de proceder a la verificación y recepción del servicio prestado por la empresa <strong>${companyName}</strong>.
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
          <h3 style="margin-top: 0; font-size: 14px; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px;">
            DETALLE DEL SERVICIO Y CONTRATO
          </h3>
          <p style="margin: 6px 0;"><strong>• Orden / Cotización N°:</strong> ${quote?.number || 'COT-001'}</p>
          <p style="margin: 6px 0;"><strong>• Proyecto / Servicio:</strong> ${projectData.nombre || 'Desarrollo de Servicio'}</p>
          <p style="margin: 6px 0;"><strong>• Descripción de Entregables:</strong> ${itemsSummary || 'Entregables concluidos según especificación'}</p>
          <p style="margin: 6px 0;"><strong>• Fecha de Inicio:</strong> ${this.formatDate(quote?.createdAt)}</p>
          <p style="margin: 6px 0;"><strong>• Fecha de Culminación:</strong> ${this.formatDate()}</p>
        </div>

        <p style="text-align: justify; margin-bottom: 16px;">
          Acta levantada al efecto, en la forma siguiente: Se deja constancia por parte de <strong>${clientCompany}</strong> que, luego de haber constatado la ejecución completa del servicio arriba señalado y sus respectivos entregables, los cuales se declaran <strong>ACEPTADOS AL 100% DE CONFORMIDAD</strong> sin observaciones al respecto, se procede a dar la conformidad formal del alcance total suscrito.
        </p>

        <p style="text-align: justify; margin-bottom: 24px;">
          En fe de lo cual, las partes firman la respectiva Acta en señal de total aceptación e inicio del periodo de garantía correspondiente.
        </p>
      </div>
    `;
  }

  /**
   * Renders the complete HTML document with styling and Signature Blocks
   */
  renderFullDocumentHtml(contract: any): string {
    const company = contract.company || {};
    const companyLogo = company.logoUrl ? `<img src="${company.logoUrl}" style="max-height: 50px;" />` : '';

    const providerSigHtml = contract.providerSignature
      ? `<img src="${contract.providerSignature}" style="max-height: 80px; max-width: 200px; display: block; margin: 0 auto 4px auto;" />`
      : `<div style="height: 60px;"></div>`;

    const clientSigHtml = contract.clientSignature
      ? `<img src="${contract.clientSignature}" style="max-height: 80px; max-width: 200px; display: block; margin: 0 auto 4px auto;" />`
      : `<div style="height: 60px;"></div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${contract.title}</title>
        <style>
          @page { size: A4; margin: 20mm 15mm 20mm 15mm; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1e293b; font-size: 13px; line-height: 1.6; }
          .header-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; border-bottom: 2px solid #cbd5e1; padding-bottom: 12px; }
          .document-content { margin-bottom: 30px; }
          .signature-section { margin-top: 40px; page-break-inside: avoid; }
          .sig-table { width: 100%; border-collapse: collapse; }
          .sig-box { width: 48%; text-align: center; vertical-align: bottom; }
        </style>
      </head>
      <body>
        <table class="header-table">
          <tr>
            <td style="width: 40%; vertical-align: middle;">
              ${companyLogo || `<h2 style="margin: 0; color: #0f172a;">${company.name || 'VERTEX'}</h2>`}
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="font-size: 12px; font-weight: bold; color: #475569;">CÓDIGO: ${contract.number}</span><br/>
              <span style="font-size: 11px; color: #64748b;">FECHA DE EMISIÓN: ${this.formatDate(contract.createdAt)}</span>
            </td>
          </tr>
        </table>

        <div class="document-content">
          ${contract.contentHtml}
        </div>

        <div class="signature-section">
          <table class="sig-table">
            <tr>
              <td class="sig-box">
                ${providerSigHtml}
                <div style="border-top: 1.5px solid #334155; width: 85%; margin: 0 auto; padding-top: 6px;">
                  <strong>POR EL PROVEEDOR</strong><br/>
                  <span style="font-size: 11px; color: #475569;">${company.legalName || company.name || 'LA EMPRESA'}</span><br/>
                  <span style="font-size: 10px; color: #64748b;">RUC: ${company.taxId || '—'}</span>
                </div>
              </td>
              <td style="width: 4%;"></td>
              <td class="sig-box">
                ${clientSigHtml}
                <div style="border-top: 1.5px solid #334155; width: 85%; margin: 0 auto; padding-top: 6px;">
                  <strong>POR EL CLIENTE</strong><br/>
                  <span style="font-size: 11px; color: #475569;">${contract.clientData?.empresa || 'EL CLIENTE'}</span><br/>
                  <span style="font-size: 10px; color: #64748b;">RUC/DNI: ${contract.clientData?.ruc || '—'}</span>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Generates and stores PDF to disk, returning path & buffer
   */
  async generateAndSavePdf(contract: any): Promise<{ pdfPath: string; buffer: Buffer }> {
    const uploadDir = this.ensureUploadDir();
    const fileName = `${contract.type === 'conformidad' ? 'ACTA' : 'CONTRATO'}_${contract.number}.pdf`;
    const fullPath = path.join(uploadDir, fileName);
    const relativePath = `/uploads/contracts/${fileName}`;

    const html = this.renderFullDocumentHtml(contract);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
        printBackground: true,
      });

      fs.writeFileSync(fullPath, pdfBuffer);

      return {
        pdfPath: relativePath,
        buffer: Buffer.from(pdfBuffer),
      };
    } finally {
      await browser.close();
    }
  }
}
