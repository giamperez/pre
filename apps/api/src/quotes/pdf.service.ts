import { Injectable } from '@nestjs/common';
import * as path from 'path';
import puppeteer from 'puppeteer';

@Injectable()
export class PdfService {
  private formatCurrency(value: number): string {
    return `S/ ${Number(value || 0).toLocaleString('es-PE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  private formatDate(date: Date): string {
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    return `${d}/${m}/${y}`;
  }

  private getImageUrl(slug: string, filename: string): string {
    const fullPath = path.join(process.cwd(), 'public', 'companies', slug, filename);
    return `file:///${fullPath.replace(/\\/g, '/')}`;
  }

  private buildHtml(quote: any): string {
    const company = quote.company;
    const slug = company.slug;
    const primary = company.colorPrimary || '#0C2448';

    const portadaUrl = this.getImageUrl(slug, 'portada.jpeg');
    const membreteUrl = this.getImageUrl(slug, 'membrete.jpeg');
    const contraportadaUrl = this.getImageUrl(slug, 'contraportada.jpeg');

    const clientData = quote.clientData as Record<string, string>;
    const projectData = quote.projectData as Record<string, string>;
    const items = (quote.items as any[]) || [];
    const additionalItems = (quote.additionalItems as any[]) || [];
    const paymentInfo = company.paymentInfo as Record<string, string> || {};

    const itemsRows = items
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.detalle || ''}</td>
          <td style="text-align:center">${item.cantidad || 1}</td>
          <td style="text-align:right">${this.formatCurrency(item.precioUnitario)}</td>
          <td style="text-align:right">${this.formatCurrency(item.total)}</td>
        </tr>`,
      )
      .join('');

    const addonsRows = additionalItems
      .map(
        (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${item.detalle || ''}</td>
          <td style="text-align:center">${item.cantidad || 1}</td>
          <td style="text-align:right">${this.formatCurrency(item.precioUnitario)}</td>
          <td style="text-align:right">${this.formatCurrency(item.total)}</td>
        </tr>`,
      )
      .join('');

    const additionalItemsSection =
      additionalItems.length > 0
        ? `
      <h3>Características Adicionales</h3>
      <table class="items-table">
        <thead>
          <tr>
            <th style="width:40px">N°</th>
            <th>Detalle</th>
            <th style="width:60px;text-align:center">Cant.</th>
            <th style="width:120px;text-align:right">P. Unitario</th>
            <th style="width:120px;text-align:right">Total</th>
          </tr>
        </thead>
        <tbody>${addonsRows}</tbody>
      </table>`
        : '';

    const considerationsSection = quote.considerations
      ? `<h3>Consideraciones</h3><p class="considerations">${quote.considerations}</p>`
      : '';

    const paymentRows = Object.entries(paymentInfo)
      .filter(([key]) => ['banco', 'cuenta', 'cci'].includes(key))
      .map(
        ([key, val]) => `
        <tr>
          <td style="color:#666;width:100px;text-transform:capitalize">${key}</td>
          <td style="font-weight:600">${val}</td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #222; }

  /* ---------- PORTADA ---------- */
  .page-portada {
    width: 210mm;
    height: 297mm;
    background-image: url('${portadaUrl}');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    page-break-after: always;
  }

  /* ---------- CONTENIDO ---------- */
  .page-content {
    width: 210mm;
    min-height: 297mm;
    background-image: url('${membreteUrl}');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    padding: 130px 40px 80px 40px;
    page-break-after: always;
  }

  h2 {
    font-size: 16px;
    font-weight: 700;
    color: ${primary};
    margin-bottom: 4px;
  }
  .meta { color: #555; margin-bottom: 20px; font-size: 10.5px; }
  h3 {
    font-size: 12px;
    font-weight: 700;
    color: ${primary};
    margin-top: 20px;
    margin-bottom: 8px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1.5px solid ${primary};
    padding-bottom: 3px;
  }

  /* Client data table */
  .client-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .client-table td { padding: 4px 6px; font-size: 10.5px; }
  .client-table td:first-child { color: #666; width: 120px; font-weight: 600; }

  /* Items table */
  .items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  .items-table thead tr { background-color: ${primary}; color: #fff; }
  .items-table th { padding: 6px 8px; text-align: left; font-size: 10px; font-weight: 600; }
  .items-table td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px; }
  .items-table tbody tr:nth-child(even) { background-color: rgba(0,0,0,0.03); }

  /* Totals */
  .totals { text-align: right; margin-top: 12px; }
  .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 2px 0; font-size: 11px; color: #444; }
  .totals .row.total { font-size: 13px; font-weight: 700; color: ${primary}; border-top: 2px solid ${primary}; margin-top: 4px; padding-top: 6px; }

  /* Payment */
  .payment-table { border-collapse: collapse; }
  .payment-table td { padding: 3px 8px; font-size: 10.5px; }

  /* Considerations */
  .considerations { font-size: 10.5px; color: #444; line-height: 1.6; white-space: pre-wrap; }

  /* ---------- CONTRAPORTADA ---------- */
  .page-contraportada {
    width: 210mm;
    height: 297mm;
    background-image: url('${contraportadaUrl}');
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    page-break-before: always;
  }
</style>
</head>
<body>

<!-- PORTADA -->
<div class="page-portada"></div>

<!-- CONTENIDO -->
<div class="page-content">

  <h2>COTIZACIÓN N° ${quote.number}</h2>
  <div class="meta">
    Fecha: ${this.formatDate(new Date(quote.createdAt))} &nbsp;|&nbsp; Válida por: 15 días calendario
  </div>

  <h3>Datos del Cliente</h3>
  <table class="client-table">
    <tr><td>Empresa</td><td>${clientData.empresa || '-'}</td></tr>
    <tr><td>RUC</td><td>${clientData.ruc || '-'}</td></tr>
    <tr><td>Solicitante</td><td>${clientData.solicitante || '-'}</td></tr>
    <tr><td>Teléfono</td><td>${clientData.telefono || '-'}</td></tr>
    <tr><td>Dirección</td><td>${clientData.direccion || '-'}</td></tr>
    <tr><td>Correo</td><td>${clientData.correo || '-'}</td></tr>
  </table>

  <h3>Proyecto</h3>
  <table class="client-table">
    <tr><td>Nombre</td><td>${projectData.nombre || '-'}</td></tr>
    <tr><td>Modalidad</td><td>${projectData.modalidad || '-'}</td></tr>
    <tr><td>Plazo</td><td>${projectData.plazo || '-'}</td></tr>
  </table>

  <h3>Paquete Base</h3>
  <table class="items-table">
    <thead>
      <tr>
        <th style="width:40px">N°</th>
        <th>Detalle</th>
        <th style="width:60px;text-align:center">Cant.</th>
        <th style="width:120px;text-align:right">P. Unitario</th>
        <th style="width:120px;text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${itemsRows}</tbody>
  </table>

  ${additionalItemsSection}

  <div class="totals">
    <div class="row"><span>SUB TOTAL:</span><span>${this.formatCurrency(quote.subtotal)}</span></div>
    <div class="row"><span>IGV (18%):</span><span>${this.formatCurrency(quote.igv)}</span></div>
    <div class="row total"><span>TOTAL:</span><span>${this.formatCurrency(quote.total)}</span></div>
  </div>

  <h3>Forma de Pago</h3>
  <table class="payment-table">
    ${paymentRows}
  </table>

  ${considerationsSection}

</div>

<!-- CONTRAPORTADA -->
<div class="page-contraportada"></div>

</body>
</html>`;
  }

  async generatePdf(quote: any): Promise<Buffer> {
    const html = this.buildHtml(quote);

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'],
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
