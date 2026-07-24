import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Quote } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(companyId?: string) {
    const where = companyId ? { companyId } : {};
    
    // Traer todas las cotizaciones con la relación a su empresa
    const quotes = await this.prisma.quote.findMany({
      where,
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let totalCotizaciones = quotes.length;
    let totalMonto = 0;
    let cotizacionesEsteMes = 0;
    let montoEsteMes = 0;
    let aprobadasCount = 0;

    const porEstadoMap = new Map<string, { cantidad: number; monto: number }>();
    const porTipoServicioMap = new Map<string, { cantidad: number; monto: number }>();
    const porEmpresaMap = new Map<string, { cantidad: number; monto: number }>();
    const porMesMap = new Map<string, { cantidad: number; monto: number }>();
    const clientesMap = new Map<string, { cantidad: number; monto: number }>();
    const fuentesMap = new Map<string, number>();
    const porSectorMap = new Map<string, { cantidad: number; monto: number }>();

    // Inicializar los últimos 12 meses para asegurar que existan en el array final aunque estén en 0
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      porMesMap.set(mStr, { cantidad: 0, monto: 0 });
    }

    quotes.forEach((q) => {
      const monto = q.total || 0;
      totalMonto += monto;

      // KPI Este mes
      const qDate = new Date(q.createdAt);
      if (qDate.getMonth() === currentMonth && qDate.getFullYear() === currentYear) {
        cotizacionesEsteMes++;
        montoEsteMes += monto;
      }

      // Tasa Aprobación
      if (q.estado === 'aprobada') aprobadasCount++;

      // Por estado
      const st = porEstadoMap.get(q.estado) || { cantidad: 0, monto: 0 };
      st.cantidad++;
      st.monto += monto;
      porEstadoMap.set(q.estado, st);

      // Por tipo servicio
      const ts = q.tipoServicio || 'No especificado';
      const tsObj = porTipoServicioMap.get(ts) || { cantidad: 0, monto: 0 };
      tsObj.cantidad++;
      tsObj.monto += monto;
      porTipoServicioMap.set(ts, tsObj);

      // Por Empresa (nuestra company, no del cliente)
      const cName = q.company?.name || 'Desconocida';
      const cObj = porEmpresaMap.get(cName) || { cantidad: 0, monto: 0 };
      cObj.cantidad++;
      cObj.monto += monto;
      porEmpresaMap.set(cName, cObj);

      // Por Mes
      const mesStr = `${qDate.getFullYear()}-${String(qDate.getMonth() + 1).padStart(2, '0')}`;
      if (porMesMap.has(mesStr)) {
        const mObj = porMesMap.get(mesStr)!;
        mObj.cantidad++;
        mObj.monto += monto;
        porMesMap.set(mesStr, mObj);
      }

      // Top Clientes (clientData.empresa)
      let clienteNombre = 'Desconocido';
      if (q.clientData && typeof q.clientData === 'object' && 'empresa' in (q.clientData as Record<string, any>)) {
        clienteNombre = ((q.clientData as Record<string, any>).empresa as string) || 'Desconocido';
      }
      const clObj = clientesMap.get(clienteNombre) || { cantidad: 0, monto: 0 };
      clObj.cantidad++;
      clObj.monto += monto;
      clientesMap.set(clienteNombre, clObj);

      // Fuentes
      const fuente = q.fuenteCliente || 'No especificado';
      fuentesMap.set(fuente, (fuentesMap.get(fuente) || 0) + 1);

      // Por Sector
      const sector = q.sectorProyecto || 'No especificado';
      const sObj = porSectorMap.get(sector) || { cantidad: 0, monto: 0 };
      sObj.cantidad++;
      sObj.monto += monto;
      porSectorMap.set(sector, sObj);
    });

    const promedioMonto = totalCotizaciones > 0 ? totalMonto / totalCotizaciones : 0;
    const tasaAprobacion = totalCotizaciones > 0 ? (aprobadasCount / totalCotizaciones) * 100 : 0;

    // Convertir mapas a arrays formateados
    const porEstado = Array.from(porEstadoMap.entries()).map(([k, v]) => ({ estado: k, ...v }));
    const porTipoServicio = Array.from(porTipoServicioMap.entries()).map(([k, v]) => ({ tipoServicio: k, ...v }));
    const porEmpresa = Array.from(porEmpresaMap.entries()).map(([k, v]) => ({ empresa: k, ...v }));
    const porMes = Array.from(porMesMap.entries()).map(([k, v]) => ({ mes: k, ...v })).sort((a, b) => a.mes.localeCompare(b.mes));
    const porSector = Array.from(porSectorMap.entries()).map(([k, v]) => ({ sector: k, ...v }));
    const fuentesCliente = Array.from(fuentesMap.entries()).map(([k, v]) => ({ fuente: k, cantidad: v }));
    
    // Top 5 clientes por monto
    const topClientes = Array.from(clientesMap.entries())
      .map(([k, v]) => ({ cliente: k, cantidad: v.cantidad, montoTotal: v.monto }))
      .sort((a, b) => b.montoTotal - a.montoTotal)
      .slice(0, 5);

    return {
      resumen: {
        totalCotizaciones,
        totalMonto,
        promedioMonto,
        cotizacionesEsteMes,
        montoEsteMes,
        tasaAprobacion
      },
      porEstado,
      porTipoServicio,
      porEmpresa,
      porMes,
      topClientes,
      fuentesCliente,
      porSector
    };
  }
}
