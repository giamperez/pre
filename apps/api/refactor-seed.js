const fs = require('fs');
const path = require('path');
const file = path.join(process.cwd(), 'prisma', 'seed.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/detalle:\s*"([^"]+)"/g, (match, text) => {
    const lines = text.split('\\n');
    const titulo = lines[0];
    const contenido = lines.slice(1).join('\\n');
    
    if(contenido.length > 0) {
       return `titulo: "${titulo}", contenido: "${contenido}"`;
    } else {
       return `titulo: "${titulo}", contenido: ""`;
    }
});

if (!content.includes('await prisma.availability.upsert')) {
    const bookingSeedCode = `
  // ---------------------------------------------------------
  // DISPONIBILIDAD Y RESERVAS
  // ---------------------------------------------------------
  const days = [1, 2, 3, 4, 5]; // Lunes a Viernes
  for (const day of days) {
    // Para Vertex
    await prisma.availability.upsert({
      where: { id: 'avail-vtx-' + day },
      update: {},
      create: {
        id: 'avail-vtx-' + day,
        companyId: vertex.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 30,
        isActive: true
      }
    });
    // Para Pyramid
    await prisma.availability.upsert({
      where: { id: 'avail-pyr-' + day },
      update: {},
      create: {
        id: 'avail-pyr-' + day,
        companyId: pyramid.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '18:00',
        slotMinutes: 30,
        isActive: true
      }
    });
  }

  await prisma.booking.createMany({
    data: [
      {
        companyId: vertex.id,
        clientName: 'Juan Perez',
        clientEmail: 'juan@example.com',
        clientPhone: '987654321',
        date: '2026-07-27',
        time: '10:00',
        status: 'pendiente',
        notes: 'Reserva de prueba'
      },
      {
        companyId: vertex.id,
        clientName: 'Maria Lopez',
        clientEmail: 'maria@example.com',
        clientPhone: '987654322',
        date: '2026-07-24',
        time: '11:00',
        status: 'confirmada',
        notes: 'Confirmada de prueba'
      },
      {
        companyId: pyramid.id,
        clientName: 'Carlos Ruiz',
        clientEmail: 'carlos@example.com',
        date: '2026-07-25',
        time: '15:30',
        status: 'cancelada',
        notes: 'Cancelada de prueba'
      }
    ]
  }).catch(() => console.log('Bookings ya existían o error'));

  console.log('✅ Seed completado con éxito');`;

    content = content.replace("console.log('✅ Seed completado con éxito');", bookingSeedCode);
}

fs.writeFileSync(file, content);
console.log('seed.ts modified successfully!');
