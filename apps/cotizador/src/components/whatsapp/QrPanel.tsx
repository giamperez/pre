import { useState } from 'react';
import { QrCode, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import type { WhatsAppSession } from '../../types';

const statusLabel: Record<string, string> = {
  disconnected: 'Desconectado',
  qr_pending: 'Esperando escaneo',
  connecting: 'Conectando…',
  connected: 'Conectado',
};

export function QrPanel({ companyId, session }: { companyId: string; session: WhatsAppSession | null }) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      await fetchWithAuth(`${API_URL}/whatsapp/${companyId}/connect`, { method: 'POST' });
    } finally {
      setLoading(false);
    }
  };

  const status = session?.status || 'disconnected';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center text-center gap-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <span
          className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500' : status === 'qr_pending' ? 'bg-amber-500' : 'bg-slate-300'}`}
        />
        {statusLabel[status] || status}
      </div>

      {status === 'qr_pending' && session?.qrCode ? (
        <img src={session.qrCode} alt="Código QR de WhatsApp" className="w-56 h-56 rounded-xl border border-slate-200" />
      ) : (
        <div className="w-56 h-56 rounded-xl border border-dashed border-slate-300 flex items-center justify-center text-slate-300">
          <QrCode className="w-16 h-16" />
        </div>
      )}

      <p className="text-sm text-slate-500 max-w-xs">
        Escanea este código con WhatsApp (Dispositivos vinculados) desde el número que usará la empresa. Solo un
        administrador necesita hacerlo — todo el equipo de ventas podrá usar el chat después.
      </p>

      <button
        onClick={handleConnect}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
        Generar código QR
      </button>
    </div>
  );
}
