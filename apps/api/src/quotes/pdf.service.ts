import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private imageToBase64(relativePath: string): string {
    const absolutePath = path.join(process.cwd(), 'public', 'companies', relativePath);
    if (!fs.existsSync(absolutePath)) {
      console.warn('Image not found:', absolutePath);
      return '';
    }
    const buffer = fs.readFileSync(absolutePath);
    const ext = path.extname(absolutePath).toLowerCase();
    const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${buffer.toString('base64')}`;
  }

  private fmt(n: number): string {
    return Number(n || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private buildHtml(quote: any): string {
    const company = quote.company;
    const slug = company.slug as string;
    const primary: string = company.colorPrimary || '#0C2448';
    const secondary: string = company.colorSecondary || '#0397A3';

    const portadaB64 = this.imageToBase64(`${slug}/portada.jpeg`);
    const membreteB64 = this.imageToBase64(`${slug}/membrete.jpeg`);
    const contraportadaB64 = this.imageToBase64(`${slug}/contraportada.jpeg`);

    const clientData: Record<string, string> = (quote.clientData as any) || {};
    const projectData: Record<string, string> = (quote.projectData as any) || {};
    const items: any[] = (quote.items as any[]) || [];
    const additionalItems: any[] = (quote.additionalItems as any[]) || [];
    const sections: any[] = (quote.sections as any[]) || [];
    const paymentInfo: Record<string, string> = (company.paymentInfo as any) || {};

    const buildItemsTable = (rows: any[], title: string): string => `
      <h3 style="color:${primary}; font-size:14px; margin-top:22px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">${title}</h3>
      <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:15px;">
        <thead>
          <tr style="background-color:${primary}; color:white;">
            <th style="padding:8px; text-align:center; width:40px; border:1px solid ${primary};">N°</th>
            <th style="padding:8px; text-align:left; border:1px solid ${primary};">Detalle</th>
            <th style="padding:8px; text-align:center; width:50px; border:1px solid ${primary};">Cant.</th>
            <th style="padding:8px; text-align:right; width:110px; border:1px solid ${primary};">P. Unitario</th>
            <th style="padding:8px; text-align:right; width:110px; border:1px solid ${primary};">Total</th>
          </tr>
        </thead>
        <tbody>
          ${rows
            .map(
              (item, i) => `
          <tr style="background-color:${i % 2 === 0 ? '#fff' : '#f9f9f9'};">
            <td style="padding:6px; border:1px solid #ddd; text-align:center;">${i + 1}</td>
            <td style="padding:6px; border:1px solid #ddd;">${item.detalle || ''}</td>
            <td style="padding:6px; border:1px solid #ddd; text-align:center;">${item.cantidad || 1}</td>
            <td style="padding:6px; border:1px solid #ddd; text-align:right;">S/ ${this.fmt(item.precioUnitario)}</td>
            <td style="padding:6px; border:1px solid #ddd; text-align:right; font-weight:600;">S/ ${this.fmt(item.total)}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>`;

    const additionalSection =
      additionalItems.length > 0
        ? buildItemsTable(additionalItems, 'Características Adicionales')
        : '';

    const considerationsSection = quote.considerations
      ? `<h3 style="color:${primary}; font-size:14px; margin-top:25px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">Consideraciones</h3>
         <p style="font-size:11px; white-space:pre-wrap; color:#444; line-height:1.6;">${quote.considerations}</p>`
      : '';

    const enabledSections = sections.filter(s => s.enabled);
    const sectionsHtml = enabledSections.map((s, i) => `
      <h3 style="color:${primary}; font-size:14px; margin-top:25px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">${i + 1}. ${s.title}</h3>
      <p style="font-size:11px; white-space:pre-wrap; color:#444; line-height:1.6;">${s.content}</p>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; }
  .page { width: 210mm; min-height: 297mm; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .portada img, .contraportada img { display: block; width: 210mm; height: 297mm; object-fit: cover; }
  .contenido {
    padding: 160px 80px 120px 80px;
    min-height: 297mm;
    background: transparent;
  }
  .membrete-bg {
    position: fixed;
    top: 0;
    left: 0;
    width: 210mm;
    height: 297mm;
    z-index: -1;
  }
  .membrete-bg img {
    width: 210mm;
    height: 297mm;
    object-fit: cover;
    display: block;
  }
  hr { border: none; border-top: 2px solid ${secondary}; margin: 14px 0; }
  h3 { color: ${primary}; font-size: 13px; margin-top: 22px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
</style>
</head>
<body>

<!-- ===== FONDO MEMBRETE (REPETIBLE) ===== -->
<div class="membrete-bg">
  <img src="${membreteB64}" alt="membrete-fondo" />
</div>

<!-- ===== PORTADA ===== -->
<div class="page portada">
  <img src="${portadaB64}" alt="portada" />
  ${slug === 'pyramid-structures' ? `
    <div style="position:absolute; top: 400px; left: 0; right: 0; text-align: center; color: white; font-size: 26px; font-weight: bold; padding: 0 40px; text-transform: uppercase;">
      ${projectData.nombre || ''}
    </div>
    <div style="position:absolute; bottom: 85px; left: 85px; color: white; font-size: 16px; font-weight: bold; text-align: left;">
      ${quote.number}
    </div>
  ` : ''}
</div>

<!-- ===== CONTENIDO ===== -->
<div class="page contenido">

  <h2 style="color:${primary}; font-size:20px; font-weight:700; margin-bottom:4px;">COTIZACIÓN N° ${quote.number}</h2>
  <p style="color:#666; font-size:11px; margin-bottom:4px;">Fecha: ${this.formatDate(new Date(quote.createdAt))} &nbsp;|&nbsp; Válida por: 15 días calendario</p>
  <hr />

  <h3>Datos del Cliente</h3>
  <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:15px;">
    <tr>
      <td style="padding:6px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">Empresa:</strong> ${clientData.empresa || '-'}</td>
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">RUC:</strong> ${clientData.ruc || '-'}</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Solicitante:</strong> ${clientData.solicitante || '-'}</td>
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Teléfono:</strong> ${clientData.telefono || '-'}</td>
    </tr>
    <tr>
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Dirección:</strong> ${clientData.direccion || '-'}</td>
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Correo:</strong> ${clientData.correo || '-'}</td>
    </tr>
  </table>

  <h3>Proyecto</h3>
  <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:15px;">
    <tr>
      <td style="padding:6px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">Nombre:</strong> ${projectData.nombre || '-'}</td>
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Modalidad:</strong> ${projectData.modalidad || '-'}</td>
    </tr>
    <tr style="background:#f9f9f9;">
      <td style="padding:6px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Plazo:</strong> ${projectData.plazo || '-'}</td>
      <td style="padding:6px 8px; border:1px solid #ddd;"></td>
    </tr>
  </table>

  ${buildItemsTable(items, 'Paquete Base')}

  ${additionalSection}

  <!-- TOTALES -->
  <div style="display:flex; justify-content:flex-end; margin-top:20px;">
    <div style="min-width:280px; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden;">
      <div style="display:flex; justify-content:space-between; padding:8px 16px; font-size:12px; background:#f9f9f9; border-bottom:1px solid #e5e7eb;">
        <span style="color:#555;">SUB TOTAL</span>
        <strong>S/ ${this.fmt(quote.subtotal)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:8px 16px; font-size:12px; border-bottom:1px solid #e5e7eb;">
        <span style="color:#555;">IGV (18%)</span>
        <strong>S/ ${this.fmt(quote.igv)}</strong>
      </div>
      <div style="display:flex; justify-content:space-between; padding:10px 16px; font-size:15px; background:${primary}; color:white;">
        <strong>TOTAL</strong>
        <strong>S/ ${this.fmt(quote.total)}</strong>
      </div>
    </div>
  </div>

  <!-- FORMA DE PAGO -->
  <h3 style="margin-top:28px;">Forma de Pago</h3>
  <table style="font-size:11px; border-collapse:collapse;">
    ${paymentInfo.banco ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600; min-width:120px;">Banco</td><td>${paymentInfo.banco}</td></tr>` : ''}
    ${paymentInfo.cuenta ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">Cuenta corriente</td><td>${paymentInfo.cuenta}</td></tr>` : ''}
    ${paymentInfo.cci ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">CCI</td><td>${paymentInfo.cci}</td></tr>` : ''}
    ${paymentInfo.ruc ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">RUC</td><td>${paymentInfo.ruc}</td></tr>` : ''}
  </table>

  ${considerationsSection}
  ${sectionsHtml}

</div>

<!-- ===== CONTRAPORTADA ===== -->
<div class="page contraportada">
  <img src="${contraportadaB64}" alt="contraportada" />
</div>

</body>
</html>`;
  }

  async generatePdf(quote: any): Promise<Buffer> {
    const html = this.buildHtml(quote);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
