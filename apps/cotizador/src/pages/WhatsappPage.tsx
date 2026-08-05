import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';
import { getUser } from '../auth';
import { useWhatsapp } from '../whatsapp-context';
import { QrPanel } from '../components/whatsapp/QrPanel';
import { ChatPanel } from '../components/whatsapp/ChatPanel';
import type { Company } from '../types';

export function WhatsappPage() {
  const { companyId, setCompanyId, session } = useWhatsapp();
  const [companies, setCompanies] = useState<Company[]>([]);
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetch(`${API_URL}/catalog`)
      .then((res) => res.json())
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const selectedCompany = companies.find((c) => c.id === companyId);

  if (!companyId) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">WhatsApp</h1>
          <p className="text-slate-500 mt-1">¿De qué empresa quieres ver o vincular el WhatsApp?</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {companies.map((company) => (
            <button
              key={company.id}
              onClick={() => setCompanyId(company.id)}
              className="text-left group bg-white border-2 border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex items-center gap-4 transition-all hover:shadow-md"
            >
              {company.logoUrl ? (
                <img src={`${API_URL}/public${company.logoUrl}`} alt={company.name} className="h-14 w-24 object-contain shrink-0" />
              ) : (
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                  style={{ backgroundColor: company.colorPrimary }}
                >
                  {company.name.charAt(0)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{company.name}</p>
                <p className="text-sm text-slate-400 mt-0.5">Ver WhatsApp</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => setCompanyId(null)}
          className="text-slate-400 hover:text-slate-600 transition-colors"
          title="Cambiar empresa"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">WhatsApp — {selectedCompany?.name || ''}</h1>
          <p className="text-slate-500 text-sm">Chat compartido con todo el equipo de ventas</p>
        </div>
      </div>

      <div className={`grid gap-6 items-start ${isAdmin && session?.status !== 'connected' ? 'lg:grid-cols-[280px_1fr]' : ''}`}>
        {isAdmin && session?.status !== 'connected' && <QrPanel companyId={companyId} session={session} />}
        <ChatPanel companyId={companyId} />
      </div>
    </div>
  );
}
