import { PrismaClient } from '@prisma/client';
import * as xlsx from 'xlsx';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('❌ Error: Debes proporcionar la ruta del archivo Excel.');
    console.log('Uso: npx ts-node scripts/import-quotes.ts <ruta-al-archivo>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: El archivo ${filePath} no existe.`);
    process.exit(1);
  }

  console.log(`📄 Leyendo archivo: ${filePath}`);
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convertir a JSON
  const rows: any[] = xlsx.utils.sheet_to_json(sheet);
  console.log(`📊 Se encontraron ${rows.length} filas.`);

  // Obtener la empresa Pyramid Structures
  const pyramid = await prisma.company.findUnique({
    where: { slug: 'pyramid-structures' }
  });

  if (!pyramid) {
    console.error('❌ Error: No se encontró la empresa Pyramid Structures en la BD.');
    process.exit(1);
  }

  let procesadas = 0;
  let importadas = 0;
  let errores = 0;
  const detallesErrores: string[] = [];

  for (const row of rows) {
    procesadas++;
    const codigo = row['Código de cotización'];

    if (!codigo) {
      console.log(`⚠️ Fila ${procesadas} omitida: No tiene código de cotización.`);
      continue;
    }

    try {
      // Parsear fecha
      let createdAt = new Date();
      if (row['Fecha de emisión']) {
         // xlsx parsea fechas como números a veces, o strings
         const rawDate = row['Fecha de emisión'];
         if (typeof rawDate === 'number') {
           // Excel date to JS Date
           createdAt = new Date(Math.round((rawDate - 25569) * 86400 * 1000));
         } else {
           const parsed = new Date(rawDate);
           if (!isNaN(parsed.getTime())) {
             createdAt = parsed;
           }
         }
      }

      const clientData = {
        empresa: row['Cliente / razón social'] || '',
        ruc: row['RUC / DNI'] || '',
        solicitante: row['Solicitante'] || '',
        dni: row['DNI solicitante'] || '',
        telefono: row['Celular'] || '',
        correo: row['Correo'] || '',
        ciudad: row['Ciudad del cliente'] || '',
      };

      const projectData = {
        nombre: row['Nombre del proyecto'] || '',
        region: row['Región del proyecto'] || '',
        plazo: row['Plazo de ejecución'] || '',
      };

      const metadata = {
        descuento: row['Descuento aplicado'] || 0,
        motivoDescuento: row['Motivo del descuento'] || '',
        formaPago: row['Forma de pago'] || '',
        fechaEnvio: row['Fecha de envío'] || '',
        proyectoEstrategico: row['Proyecto estratégico'] || '',
        potencialFuturo: row['Potencial futuro del cliente'] || '',
        observaciones: row['Observaciones generales'] || '',
      };

      // Si no tiene empresa cotizante -> asumir pyramid-structures
      // Si dice "Pyramid" o "Pyramid Structures" -> usar pyramid-structures
      // En este script asumimos todo como Pyramid según requerimiento a menos que se necesite otra
      const companyId = pyramid.id;

      const subtotal = Number(row['Subtotal sin IGV']) || 0;
      const igv = Number(row['IGV']) || 0;
      const total = Number(row['Total con IGV']) || 0;

      const existing = await prisma.quote.findFirst({
        where: { number: codigo.toString(), companyId }
      });

      const data = {
        companyId,
        number: codigo.toString(),
        clientData,
        projectData,
        ubicacionProyecto: row['Ubicación del proyecto'] || '',
        sectorProyecto: row['Sector del proyecto'] || '',
        tipoProyecto: row['Tipo de proyecto'] || '',
        tipoServicio: row['Tipo de servicio principal'] || '',
        tipoCliente: row['Tipo de cliente'] || '',
        clienteNuevoRecurrente: row['Cliente nuevo/recurrente'] || '',
        fuenteCliente: row['Fuente del cliente'] || '',
        subtotal,
        igv,
        total,
        items: [],
        estado: 'aprobada',
        metadata,
        createdAt,
      };

      if (existing) {
        await prisma.quote.update({
          where: { id: existing.id },
          data
        });
      } else {
        await prisma.quote.create({
          data
        });
      }

      importadas++;
    } catch (error: any) {
      errores++;
      detallesErrores.push(`Fila ${procesadas} (${codigo}): ${error.message}`);
    }
  }

  console.log('\n✅ IMPORTACIÓN FINALIZADA');
  console.log(`- Filas procesadas: ${procesadas}`);
  console.log(`- Importadas exitosamente: ${importadas}`);
  console.log(`- Errores: ${errores}`);
  if (errores > 0) {
    console.log('\n❌ Detalles de errores:');
    detallesErrores.forEach(d => console.log(d));
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
