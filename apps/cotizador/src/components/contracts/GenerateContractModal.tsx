import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ScrollText, CheckCircle2, ArrowRight, Loader2, FileCheck, Hash, User, Building } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import type { Quote } from '../../types';

interface GenerateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote | null;
  defaultType?: 'contrato' | 'conformidad';
}

export function GenerateContractModal({
  isOpen,
  onClose,
  quote,
  defaultType = 'contrato',
}: GenerateContractModalProps) {
  const navigate = useNavigate();
  const [docType, setDocType] = useState<'contrato' | 'conformidad'>(defaultType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !quote) return null;

  const clientData: any = typeof quote.clientData === 'object' ? quote.clientData : {};

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth(`${API_URL}/contracts/from-quote/${quote.id}?type=${docType}`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Error al generar borrador del documento');
      }

      const contract = await res.json();
      onClose();
      navigate(`/contratos/editar/${contract.id}`);
    } catch (err: any) {
      setError(err.message || 'Error al generar el documento');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Generar Documento Legal</h3>
              <p className="text-xs text-slate-400">Extrae automáticamente los datos de la cotización</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quote Context Card */}
        <div className="p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                <Hash className="w-3 h-3" /> Cotización {quote.number}
              </span>
              <span className="text-sm font-bold text-slate-800">
                S/ {quote.total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 text-slate-600">
              <div className="flex items-center gap-1.5 truncate">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium truncate">{clientData.empresa || 'Cliente'}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{clientData.solicitante || 'Contacto'}</span>
              </div>
            </div>
          </div>

          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-5 mb-3">
            Selecciona el tipo de documento a generar
          </h4>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDocType('contrato')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                docType === 'contrato'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${docType === 'contrato' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <ScrollText className="w-4 h-4" />
                </div>
                {docType === 'contrato' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">Contrato de Servicio</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Cláusulas legales, precio, términos y entregables</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDocType('conformidad')}
              className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                docType === 'conformidad'
                  ? 'border-indigo-600 bg-indigo-50/70 shadow-sm'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${docType === 'conformidad' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <FileCheck className="w-4 h-4" />
                </div>
                {docType === 'conformidad' && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
              </div>
              <div>
                <p className="font-bold text-slate-800 text-xs">Acta de Conformidad</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Recepción conforme al 100% y fechas de inicio/fin</p>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-white flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando borrador...
              </>
            ) : (
              <>
                Abrir Editor Interactivo
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
