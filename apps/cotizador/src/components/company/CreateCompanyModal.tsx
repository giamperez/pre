import { useState } from 'react';
import { X, ShieldAlert } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import type { Company } from '../../types';
import { CompanyForm } from './CompanyForm';
import { emptyCompanyForm } from './companyForm.types';

function buildPaymentInfo(form: ReturnType<typeof emptyCompanyForm>) {
  const entries = [
    ['banco', form.banco], ['cuenta', form.cuenta], ['cci', form.cci],
    ['iban', form.iban], ['swift', form.swift],
  ].filter(([, v]) => v);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

export function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: (company: Company) => void }) {
  const [form, setForm] = useState(emptyCompanyForm());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_URL}/companies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          colorPrimary: form.colorPrimary,
          colorSecondary: form.colorSecondary,
          contactPhone: form.contactPhone || undefined,
          contactEmail: form.contactEmail || undefined,
          legalName: form.legalName || undefined,
          taxId: form.taxId || undefined,
          country: form.country || undefined,
          legalEntityType: form.legalEntityType || undefined,
          fiscalAddress: form.fiscalAddress || undefined,
          paymentInfo: buildPaymentInfo(form),
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Error al crear la empresa');
      }
      const company = await res.json();
      onCreated(company);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nueva empresa</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <CompanyForm form={form} setForm={setForm} />

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <p className="text-xs text-slate-400">
            Podrás subir el logo, portada, contraportada y membrete justo después de crearla.
          </p>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
