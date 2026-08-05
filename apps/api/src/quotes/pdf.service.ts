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

  /**
   * Empresas creadas/editadas desde el cotizador guardan la ruta real de la imagen subida
   * (ej. coverImageUrl). Empresas antiguas (Vertex/Pyramid) no tienen ese campo lleno pero sí
   * tienen el archivo en disco bajo la convención fija <slug>/<fallbackFilename>.
   */
  private resolveCompanyImage(dbPath: string | null | undefined, slug: string, fallbackFilename: string): string {
    if (dbPath) {
      const relative = dbPath.replace(/^\/?companies\//, '');
      const fromDb = this.imageToBase64(relative);
      if (fromDb) return fromDb;
    }
    return this.imageToBase64(`${slug}/${fallbackFilename}`);
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

    const portadaB64 = this.resolveCompanyImage(company.coverImageUrl, slug, 'portada.jpeg');
    const membreteB64 = this.resolveCompanyImage(company.letterheadUrl, slug, 'membrete.jpeg');
    const contraportadaB64 = this.resolveCompanyImage(company.backCoverImageUrl, slug, 'contraportada.jpeg');

    const clientData: Record<string, string> = (quote.clientData as any) || {};
    const projectData: Record<string, string> = (quote.projectData as any) || {};
    const items: any[] = (quote.items as any[]) || [];
    const additionalItems: any[] = (quote.additionalItems as any[]) || [];
    const sections: any[] = (quote.sections as any[]) || [];
    let paymentInfo: Record<string, string> = {};
    if (company.paymentInfo) {
      try {
        paymentInfo = JSON.parse(company.paymentInfo);
      } catch {
        paymentInfo = {};
      }
    }
    const taxId: string | undefined = company.taxId || paymentInfo.ruc;

    // ── Helpers ────────────────────────────────────────────────────────────────
    const bg = `background-image:url('${membreteB64}');`;

    const pagina = (content: string) =>
      `<div class="pagina-contenido" style="${bg}">${content}</div>`;

    const buildItemsTableBody = (rows: any[], startIdx = 0): string =>
      rows.map((item, i) => `
        <tr style="background-color:${(i + startIdx) % 2 === 0 ? '#fff' : '#f9f9f9'};">
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${startIdx + i + 1}</td>
          <td style="padding:6px; border:1px solid #ddd; white-space:pre-wrap;">
            <strong>${item.titulo || item.detalle || ''}</strong>
            ${item.contenido ? `<br/><span style="font-size:11px; color:#444;">${item.contenido}</span>` : ''}
          </td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${item.cantidad || 1}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right;">S/ ${this.fmt(item.precioUnitario)}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right; font-weight:600;">S/ ${this.fmt(item.total)}</td>
        </tr>`).join('');

    const tableHeader = (title: string) => `
      <h3 style="color:${primary}; font-size:14px; margin-top:15px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">${title}</h3>
      <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:12px;">
        <thead>
          <tr style="background-color:${primary}; color:white;">
            <th style="padding:8px; text-align:center; width:40px; border:1px solid ${primary};">N°</th>
            <th style="padding:8px; text-align:left; border:1px solid ${primary};">Detalle</th>
            <th style="padding:8px; text-align:center; width:50px; border:1px solid ${primary};">Cant.</th>
            <th style="padding:8px; text-align:right; width:110px; border:1px solid ${primary};">P. Unitario</th>
            <th style="padding:8px; text-align:right; width:110px; border:1px solid ${primary};">Total</th>
          </tr>
        </thead>
        <tbody>`;

    const tableFooter = `</tbody></table>`;

    const buildFullTable = (rows: any[], title: string, startIdx = 0): string =>
      tableHeader(title) + buildItemsTableBody(rows, startIdx) + tableFooter;

    // ── Paginación de ítems ────────────────────────────────────────────────────
    const ITEMS_POR_PAGINA = 6;
    const paginasItems: any[][] = [];
    for (let i = 0; i < items.length; i += ITEMS_POR_PAGINA) {
      paginasItems.push(items.slice(i, i + ITEMS_POR_PAGINA));
    }
    if (paginasItems.length === 0) paginasItems.push([]);

    // ── Secciones legales: grupos de 3 ────────────────────────────────────────
    const enabledSections = sections.filter(s => s.enabled);
    const gruposSecciones: any[][] = [];
    for (let i = 0; i < enabledSections.length; i += 3) {
      gruposSecciones.push(enabledSections.slice(i, i + 3));
    }

    // ── Bloques de contenido ──────────────────────────────────────────────────
    const headerBlock = `
      <h2 style="color:${primary}; font-size:20px; font-weight:700; margin-bottom:8px;">COTIZACIÓN N° ${quote.number}</h2>
      <p style="color:#666; font-size:11px; margin-bottom:8px;">Fecha: ${this.formatDate(new Date(quote.createdAt))} &nbsp;|&nbsp; Válida por: 15 días calendario</p>
      <hr style="border:none; border-top:2px solid ${secondary}; margin:10px 0;" />
    `;

    const clientBlock = `
      <h3 style="color:${primary}; font-size:13px; margin-top:12px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Datos del Cliente</h3>
      <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:12px;">
        <tr>
          <td style="padding:5px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">Empresa:</strong> ${clientData.empresa || '-'}</td>
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">RUC:</strong> ${clientData.ruc || '-'}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Solicitante:</strong> ${clientData.solicitante || '-'}</td>
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Teléfono:</strong> ${clientData.telefono || '-'}</td>
        </tr>
        <tr>
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Dirección:</strong> ${clientData.direccion || '-'}</td>
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Correo:</strong> ${clientData.correo || '-'}</td>
        </tr>
      </table>
    `;

    const projectBlock = `
      <h3 style="color:${primary}; font-size:13px; margin-top:0; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Proyecto</h3>
      <table style="width:100%; font-size:11px; border-collapse:collapse; margin-bottom:12px;">
        <tr>
          <td style="padding:5px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">Nombre:</strong> ${projectData.nombre || '-'}</td>
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Modalidad:</strong> ${projectData.modalidad || '-'}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:5px 8px; border:1px solid #ddd;"><strong style="color:${primary};">Plazo:</strong> ${projectData.plazo || '-'}</td>
          <td style="padding:5px 8px; border:1px solid #ddd;"></td>
        </tr>
      </table>
    `;

    const totalesBlock = `
      <div style="display:flex; justify-content:flex-end; margin-top:16px;">
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
    `;

    const pagoBlock = `
      <h3 style="color:${primary}; font-size:13px; margin-top:20px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Forma de Pago</h3>
      <table style="font-size:11px; border-collapse:collapse;">
        ${paymentInfo.banco ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600; min-width:120px;">Banco</td><td>${paymentInfo.banco}</td></tr>` : ''}
        ${paymentInfo.cuenta ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">Cuenta corriente</td><td>${paymentInfo.cuenta}</td></tr>` : ''}
        ${paymentInfo.cci ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">CCI</td><td>${paymentInfo.cci}</td></tr>` : ''}
        ${taxId ? `<tr><td style="color:#555; padding:3px 16px 3px 0; font-weight:600;">RUC</td><td>${taxId}</td></tr>` : ''}
      </table>
    `;

    const consideracionesBlock = quote.considerations
      ? `<h3 style="color:${primary}; font-size:13px; margin-top:16px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">Consideraciones</h3>
         <p style="font-size:11px; white-space:pre-wrap; color:#444; line-height:1.6;">${quote.considerations}</p>`
      : '';

    const additionalsBlock = additionalItems.length > 0
      ? buildFullTable(additionalItems, 'Características Adicionales')
      : '';

    // ── Armar páginas ─────────────────────────────────────────────────────────
    const pagina1 = pagina(
      headerBlock +
      clientBlock +
      projectBlock +
      buildFullTable(paginasItems[0], 'Paquete Base', 0)
    );

    const paginasContinuacion = paginasItems.slice(1).map((grupo, idx) =>
      pagina(
        tableHeader(`Paquete Base (continuación)`) +
        buildItemsTableBody(grupo, (idx + 1) * ITEMS_POR_PAGINA) +
        tableFooter
      )
    ).join('');

    const paginaTotales = pagina(
      additionalsBlock +
      totalesBlock +
      pagoBlock +
      consideracionesBlock
    );

    const paginasLegales = gruposSecciones.map(grupo => {
      const html = grupo.map(s => `
        <h3 style="color:${primary}; font-size:14px; margin-top:20px; margin-bottom:8px; text-transform:uppercase; letter-spacing:0.5px;">${enabledSections.indexOf(s) + 1}. ${s.title}</h3>
        <p style="font-size:11px; white-space:pre-wrap; color:#444; line-height:1.6;">${s.content}</p>
      `).join('');
      return pagina(html);
    }).join('');

    // ── HTML final ────────────────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; }
  .page { width: 210mm; height: 297mm; position: relative; page-break-after: always; overflow: hidden; }
  .page:last-child { page-break-after: auto; }
  .portada img, .contraportada img { display: block; width: 210mm; height: 297mm; object-fit: cover; }
  .pagina-contenido {
    width: 210mm;
    height: 297mm;
    position: relative;
    page-break-after: always;
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
    padding: 160px 70px 140px 70px;
    box-sizing: border-box;
    overflow: hidden;
  }
</style>
</head>
<body>

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

<!-- ===== PÁGINAS CONTENIDO ===== -->
${pagina1}
${paginasContinuacion}
${paginaTotales}
${paginasLegales}

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
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      displayHeaderFooter: false,
    });

    await browser.close();
    return Buffer.from(pdfBuffer);
  }
}
