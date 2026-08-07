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
            ${item.contenido ? `<br/><span style="font-size:10.5px; color:#444;">${item.contenido}</span>` : ''}
          </td>
          <td style="padding:6px; border:1px solid #ddd; text-align:center;">${item.cantidad || 1}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right;">S/ ${this.fmt(item.precioUnitario)}</td>
          <td style="padding:6px; border:1px solid #ddd; text-align:right; font-weight:600;">S/ ${this.fmt(item.total)}</td>
        </tr>`).join('');

    const tableHeader = (title: string) => `
      <h3 style="color:${primary}; font-size:13px; margin-top:12px; margin-bottom:6px; text-transform:uppercase; letter-spacing:0.5px;">${title}</h3>
      <table style="width:100%; font-size:10.5px; border-collapse:collapse; margin-bottom:10px;">
        <thead>
          <tr style="background-color:${primary}; color:white;">
            <th style="padding:7px; text-align:center; width:35px; border:1px solid ${primary};">N°</th>
            <th style="padding:7px; text-align:left; border:1px solid ${primary};">Detalle</th>
            <th style="padding:7px; text-align:center; width:45px; border:1px solid ${primary};">Cant.</th>
            <th style="padding:7px; text-align:right; width:100px; border:1px solid ${primary};">P. Unitario</th>
            <th style="padding:7px; text-align:right; width:100px; border:1px solid ${primary};">Total</th>
          </tr>
        </thead>
        <tbody>`;

    const tableFooter = `</tbody></table>`;

    const buildFullTable = (rows: any[], title: string, startIdx = 0): string =>
      tableHeader(title) + buildItemsTableBody(rows, startIdx) + tableFooter;

    // ── Bloques de contenido ──────────────────────────────────────────────────
    const metadata = (quote.metadata as any) || {};
    const fieldLabels = metadata.fieldLabels || projectData.fieldLabels || {};

    const headerBlock = `
      <h2 style="color:${primary}; font-size:18px; font-weight:700; margin-bottom:6px;">COTIZACIÓN N° ${quote.number}</h2>
      <p style="color:#666; font-size:10.5px; margin-bottom:6px;">Fecha: ${this.formatDate(new Date(quote.createdAt))} &nbsp;|&nbsp; Válida por: 15 días calendario</p>
      <hr style="border:none; border-top:2px solid ${secondary}; margin:8px 0 12px 0;" />
    `;

    const clientBlock = `
      <h3 style="color:${primary}; font-size:12px; margin-top:4px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Datos del Cliente</h3>
      <table style="width:100%; font-size:10.5px; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="padding:4px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">${fieldLabels.empresaLabel || 'Empresa'}:</strong> ${clientData.empresa || '-'}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.rucLabel || 'RUC'}:</strong> ${clientData.ruc || '-'}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.solicitanteLabel || 'Solicitante'}:</strong> ${clientData.solicitante || '-'}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.telefonoLabel || 'Teléfono'}:</strong> ${clientData.telefono || '-'}</td>
        </tr>
        <tr>
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.direccionLabel || 'Dirección'}:</strong> ${clientData.direccion || '-'}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.correoLabel || 'Correo'}:</strong> ${clientData.correo || '-'}</td>
        </tr>
      </table>
    `;

    const projectBlock = `
      <h3 style="color:${primary}; font-size:12px; margin-top:0; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Proyecto</h3>
      <table style="width:100%; font-size:10.5px; border-collapse:collapse; margin-bottom:10px;">
        <tr>
          <td style="padding:4px 8px; border:1px solid #ddd; width:50%;"><strong style="color:${primary};">${fieldLabels.nombreProyectoLabel || 'Nombre'}:</strong> ${projectData.nombre || '-'}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.modalidadLabel || 'Modalidad'}:</strong> ${projectData.modalidad || '-'}</td>
        </tr>
        <tr style="background:#f9f9f9;">
          <td style="padding:4px 8px; border:1px solid #ddd;"><strong style="color:${primary};">${fieldLabels.plazoLabel || 'Plazo'}:</strong> ${projectData.plazo || '-'}</td>
          <td style="padding:4px 8px; border:1px solid #ddd;"></td>
        </tr>
      </table>
    `;

    const totalesBlock = `
      <div style="display:flex; justify-content:flex-end; margin-top:12px;">
        <div style="min-width:260px; border:1px solid #e5e7eb; border-radius:4px; overflow:hidden;">
          <div style="display:flex; justify-content:space-between; padding:6px 14px; font-size:11px; background:#f9f9f9; border-bottom:1px solid #e5e7eb;">
            <span style="color:#555;">SUB TOTAL</span>
            <strong>S/ ${this.fmt(quote.subtotal)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:6px 14px; font-size:11px; border-bottom:1px solid #e5e7eb;">
            <span style="color:#555;">IGV (18%)</span>
            <strong>S/ ${this.fmt(quote.igv)}</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:8px 14px; font-size:14px; background:${primary}; color:white;">
            <strong>TOTAL</strong>
            <strong>S/ ${this.fmt(quote.total)}</strong>
          </div>
        </div>
      </div>
    `;

    const pagoBlock = `
      <h3 style="color:${primary}; font-size:12px; margin-top:14px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Forma de Pago</h3>
      <table style="font-size:10.5px; border-collapse:collapse;">
        ${paymentInfo.banco ? `<tr><td style="color:#555; padding:2px 14px 2px 0; font-weight:600; min-width:110px;">Banco</td><td>${paymentInfo.banco}</td></tr>` : ''}
        ${paymentInfo.cuenta ? `<tr><td style="color:#555; padding:2px 14px 2px 0; font-weight:600;">Cuenta corriente</td><td>${paymentInfo.cuenta}</td></tr>` : ''}
        ${paymentInfo.cci ? `<tr><td style="color:#555; padding:2px 14px 2px 0; font-weight:600;">CCI</td><td>${paymentInfo.cci}</td></tr>` : ''}
        ${taxId ? `<tr><td style="color:#555; padding:2px 14px 2px 0; font-weight:600;">RUC</td><td>${taxId}</td></tr>` : ''}
      </table>
    `;

    const consideracionesBlock = quote.considerations
      ? `<h3 style="color:${primary}; font-size:12px; margin-top:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">Consideraciones</h3>
         <p style="font-size:10.5px; white-space:pre-wrap; color:#444; line-height:1.5;">${quote.considerations}</p>`
      : '';

    const additionalsBlock = additionalItems.length > 0
      ? buildFullTable(additionalItems, 'Características Adicionales')
      : '';

    // ── Paginación Optimizada y Compacta ─────────────────────────────────────────
    // Si los ítems caben holgadamente en la pág 1 (<=4 ítems y sin adicionales), metemos Totales + Pago en Pág 1.
    const canFitEverythingOnPage1 = items.length <= 4 && additionalItems.length === 0;

    let paginasContenidoHtml = '';

    if (canFitEverythingOnPage1) {
      paginasContenidoHtml += pagina(
        headerBlock +
        clientBlock +
        projectBlock +
        buildFullTable(items, 'Paquete Base', 0) +
        totalesBlock +
        pagoBlock +
        consideracionesBlock
      );
    } else {
      // Página 1: Encabezado + Cliente + Proyecto + Paquete Base (hasta 7 ítems)
      const ITEMS_PAGINA_1 = 7;
      const primerGrupo = items.slice(0, ITEMS_PAGINA_1);
      const restoItems = items.slice(ITEMS_PAGINA_1);

      paginasContenidoHtml += pagina(
        headerBlock +
        clientBlock +
        projectBlock +
        buildFullTable(primerGrupo, 'Paquete Base', 0)
      );

      // Si quedan más ítems del paquete base, paginar en grupos de 8
      if (restoItems.length > 0) {
        const ITEMS_POR_PAGINA = 8;
        for (let i = 0; i < restoItems.length; i += ITEMS_POR_PAGINA) {
          const grupo = restoItems.slice(i, i + ITEMS_POR_PAGINA);
          paginasContenidoHtml += pagina(
            tableHeader(`Paquete Base (continuación)`) +
            buildItemsTableBody(grupo, ITEMS_PAGINA_1 + i) +
            tableFooter
          );
        }
      }

      // Página de Totales y Consideraciones
      paginasContenidoHtml += pagina(
        additionalsBlock +
        totalesBlock +
        pagoBlock +
        consideracionesBlock
      );
    }

    // ── Secciones legales: agrupadas eficientemente (5 a 6 por página) ──────────
    const enabledSections = sections.filter(s => s.enabled);
    const SECCIONES_POR_PAGINA = 5;
    for (let i = 0; i < enabledSections.length; i += SECCIONES_POR_PAGINA) {
      const grupo = enabledSections.slice(i, i + SECCIONES_POR_PAGINA);
      const htmlGrupo = grupo.map(s => `
        <div style="margin-bottom:12px; page-break-inside:avoid;">
          <h3 style="color:${primary}; font-size:12px; margin-bottom:4px; text-transform:uppercase; letter-spacing:0.5px;">${enabledSections.indexOf(s) + 1}. ${s.title}</h3>
          <p style="font-size:10.5px; white-space:pre-wrap; color:#444; line-height:1.5; margin:0;">${s.content}</p>
        </div>
      `).join('');
      paginasContenidoHtml += pagina(htmlGrupo);
    }

    // ── HTML final ────────────────────────────────────────────────────────────
    return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<style>
  @page { margin: 0; size: A4; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #333; }
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
    padding: 130px 65px 110px 65px;
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
${paginasContenidoHtml}

<!-- ===== CONTRAPORTADA ===== -->
<div class="page contraportada">
  <img src="${contraportadaB64}" alt="contraportada" />
</div>

</body>
</html>`;
  }

  async generatePdf(quote: any): Promise<Buffer> {
    const html = this.buildHtml(quote);

    const puppeteerArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ];

    const executablePath =
      process.env.PUPPETEER_EXECUTABLE_PATH ||
      (fs.existsSync('/usr/bin/chromium')
        ? '/usr/bin/chromium'
        : fs.existsSync('/usr/bin/chromium-browser')
        ? '/usr/bin/chromium-browser'
        : fs.existsSync('/usr/bin/google-chrome-stable')
        ? '/usr/bin/google-chrome-stable'
        : undefined);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: puppeteerArgs,
        ...(executablePath ? { executablePath } : {}),
      });
    } catch (err: any) {
      console.warn('Puppeteer default launch failed, retrying minimal launch args...', err.message);
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
    }

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load', timeout: 45000 });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
        displayHeaderFooter: false,
      });

      return Buffer.from(pdfBuffer);
    } finally {
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }
}
