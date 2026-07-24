import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../config';
import { fetchWithAuth } from '../auth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart as HBarChart
} from 'recharts';
import { FileText, DollarSign, TrendingUp, CheckCircle, RefreshCw, Building2 } from 'lucide-react';

// ─── Paleta de colores ─────────────────────────────────────────────────────────
const COLORS = ['#0C2448', '#0397A3', '#4F7FBF', '#7FB3D3', '#A8DADC', '#1D4E89', '#2E86AB', '#A23B72'];
const ESTADO_COLORS: Record<string, string> = {
  borrador: '#94a3b8',
  enviada: '#3b82f6',
  aprobada: '#22c55e',
  rechazada: '#ef4444',
  vencida: '#f97316',
};

const fmt = (n: number) =>
  new Intl.NumberFormat('es-PE', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const fmtMes = (m: string) => {
  const [y, mo] = m.split('-');
  const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${meses[parseInt(mo) - 1]} ${y.slice(2)}`;
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  icon: Icon, label, value, sub, color = 'indigo',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  const colorMap: Record<string, string> = {
    indigo: 'bg-indigo-50 text-indigo-600',
    teal: 'bg-teal-50 text-teal-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
  };
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────────
function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm p-5 ${className}`}>
      {title && <h3 className="text-sm font-semibold text-slate-700 mb-4">{title}</h3>}
      {children}
    </div>
  );
}

// ─── Custom pie label ───────────────────────────────────────────────────────────
const renderCustomLabel = ({ name, percent }: any) =>
  percent > 0.05 ? `${name} (${(percent * 100).toFixed(0)}%)` : '';

// ─── Tooltip personalizado ─────────────────────────────────────────────────────
function MoneyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name === 'monto' ? `S/ ${fmt(p.value)}` : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Cargar empresas para el filtro
  useEffect(() => {
    fetch(`${API_URL}/catalog`)
      .then(r => r.json())
      .then(d => setCompanies(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    const url = `${API_URL}/analytics${companyId ? `?companyId=${companyId}` : ''}`;
    fetchWithAuth(url)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('No se pudo cargar el dashboard'); setLoading(false); });
  }, [companyId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full" />
          <p className="text-slate-500 text-sm">Cargando analytics...</p>
        </div>
      </div>
    );
  }

  if (error) return <div className="text-center py-16 text-red-500">{error}</div>;
  if (!data) return null;

  const { resumen, porEstado, porTipoServicio, porEmpresa, porMes, topClientes, fuentesCliente } = data;

  // Formatear datos de estado con colores
  const porEstadoConColor = porEstado.map((e: any) => ({
    ...e,
    fill: ESTADO_COLORS[e.estado] || '#94a3b8',
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Dashboard de Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5">Resumen de cotizaciones y desempeño comercial</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filtro empresa */}
          <select
            value={companyId}
            onChange={e => setCompanyId(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
          >
            <option value="">Todas las empresas</option>
            {companies.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Actualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── FILA 1: KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={FileText}
          label="Total cotizaciones"
          value={String(resumen.totalCotizaciones)}
          sub={`${resumen.cotizacionesEsteMes} este mes`}
          color="indigo"
        />
        <KpiCard
          icon={DollarSign}
          label="Monto total"
          value={`S/ ${fmt(resumen.totalMonto)}`}
          sub={`S/ ${fmt(resumen.montoEsteMes)} este mes`}
          color="teal"
        />
        <KpiCard
          icon={TrendingUp}
          label="Promedio por cotización"
          value={`S/ ${fmt(resumen.promedioMonto)}`}
          color="orange"
        />
        <KpiCard
          icon={CheckCircle}
          label="Tasa de aprobación"
          value={`${resumen.tasaAprobacion.toFixed(1)}%`}
          color="green"
        />
      </div>

      {/* ── FILA 2: Gráficas principales ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monto por mes — BarChart */}
        <Card title="Monto por mes (últimos 12 meses)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={porMes} margin={{ left: 0, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="mes" tickFormatter={fmtMes} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => `S/${fmt(v)}`} tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
              <Tooltip content={<MoneyTooltip />} />
              <Bar dataKey="monto" fill="#0C2448" radius={[4, 4, 0, 0]} name="monto" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Por tipo de servicio — PieChart */}
        <Card title="Por tipo de servicio">
          {porTipoServicio.length === 0 ? (
            <div className="h-60 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={porTipoServicio}
                  dataKey="monto"
                  nameKey="tipoServicio"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={45}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {porTipoServicio.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => `S/ ${fmt(v)}`} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* ── FILA 3: Tablas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tabla por empresa */}
        <Card title="Por empresa">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs border-b border-slate-100">
                  <th className="pb-2 font-medium">Empresa</th>
                  <th className="pb-2 font-medium text-right">Cots.</th>
                  <th className="pb-2 font-medium text-right">Monto total</th>
                </tr>
              </thead>
              <tbody>
                {porEmpresa.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 font-medium text-slate-700">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {row.empresa}
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{row.cantidad}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">S/ {fmt(row.monto)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Top 5 clientes */}
        <Card title="Top 5 clientes por monto">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 text-xs border-b border-slate-100">
                  <th className="pb-2 font-medium">Cliente</th>
                  <th className="pb-2 font-medium text-right">Cots.</th>
                  <th className="pb-2 font-medium text-right">Monto</th>
                </tr>
              </thead>
              <tbody>
                {topClientes.map((row: any, i: number) => (
                  <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 text-slate-700 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                        {row.cliente}
                      </div>
                    </td>
                    <td className="py-2.5 text-right text-slate-600">{row.cantidad}</td>
                    <td className="py-2.5 text-right font-semibold text-slate-800">S/ {fmt(row.montoTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* ── FILA 4: Gráficas secundarias ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Por estado — Barras horizontales */}
        <Card title="Cotizaciones por estado">
          {porEstadoConColor.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <HBarChart data={porEstadoConColor} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis type="category" dataKey="estado" tick={{ fontSize: 11, fill: '#64748b' }} width={80} />
                <Tooltip content={<MoneyTooltip />} />
                <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} name="cantidad">
                  {porEstadoConColor.map((entry: any, index: number) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </HBarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Fuentes de clientes — PieChart dona */}
        <Card title="Fuente de clientes">
          {fuentesCliente.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Sin datos</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={fuentesCliente}
                  dataKey="cantidad"
                  nameKey="fuente"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {fuentesCliente.map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    </div>
  );
}
