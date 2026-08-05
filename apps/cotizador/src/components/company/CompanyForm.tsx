import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { type CompanyFormState, slugify } from './companyForm.types';

const COUNTRY_PRESETS = [
  'Perú', 'Colombia', 'México', 'Chile', 'Argentina', 'Ecuador', 'Bolivia',
  'Venezuela', 'España', 'Estados Unidos',
];

const inputCls = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all";
const labelCls = "block text-sm font-medium text-slate-700 mb-1";

export function CompanyForm({
  form,
  setForm,
  slugLocked = false,
}: {
  form: CompanyFormState;
  setForm: (updater: (f: CompanyFormState) => CompanyFormState) => void;
  /** true en edición: no auto-derivar el slug al cambiar el nombre */
  slugLocked?: boolean;
}) {
  const [showBanking, setShowBanking] = useState(
    () => Boolean(form.banco || form.cuenta || form.cci || form.iban || form.swift),
  );
  const [showCustomCountry, setShowCustomCountry] = useState(
    () => Boolean(form.country) && !COUNTRY_PRESETS.includes(form.country),
  );

  const handleNameChange = (value: string) => {
    setForm(f => ({ ...f, name: value, slug: slugLocked ? f.slug : slugify(value) }));
  };

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Nombre *</label>
          <input required value={form.name} onChange={e => handleNameChange(e.target.value)} className={inputCls} placeholder="Ej. Vertex Developers" />
        </div>
        <div>
          <label className={labelCls}>Slug (identificador para URLs) *</label>
          <input
            required
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: slugify(e.target.value) }))}
            className={inputCls}
            placeholder="vertex-developers"
          />
          <p className="text-xs text-slate-400 mt-1">Se usará en enlaces como /nueva/{form.slug || '...'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Color primario</label>
            <input type="color" value={form.colorPrimary} onChange={e => setForm(f => ({ ...f, colorPrimary: e.target.value }))} className="w-full h-10 border border-slate-200 rounded-xl cursor-pointer" />
          </div>
          <div>
            <label className={labelCls}>Color secundario</label>
            <input type="color" value={form.colorSecondary} onChange={e => setForm(f => ({ ...f, colorSecondary: e.target.value }))} className="w-full h-10 border border-slate-200 rounded-xl cursor-pointer" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Teléfono de contacto</label>
          <input value={form.contactPhone} onChange={e => setForm(f => ({ ...f, contactPhone: e.target.value }))} className={inputCls} placeholder="+51 999 000 000" />
        </div>
        <div>
          <label className={labelCls}>Correo de contacto</label>
          <input type="email" value={form.contactEmail} onChange={e => setForm(f => ({ ...f, contactEmail: e.target.value }))} className={inputCls} placeholder="contacto@empresa.com" />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 space-y-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Identidad legal</p>
        <div>
          <label className={labelCls}>Razón social</label>
          <input value={form.legalName} onChange={e => setForm(f => ({ ...f, legalName: e.target.value }))} className={inputCls} placeholder="Nombre legal registrado, si difiere del comercial" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>RUC / Tax ID</label>
            <input value={form.taxId} onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))} className={inputCls} placeholder="20609532646" />
          </div>
          <div>
            <label className={labelCls}>Tipo de entidad</label>
            <input value={form.legalEntityType} onChange={e => setForm(f => ({ ...f, legalEntityType: e.target.value }))} className={inputCls} placeholder="SAC, SRL, LLC..." />
          </div>
        </div>
        <div>
          <label className={labelCls}>País</label>
          <select
            className={`${inputCls} bg-white`}
            value={showCustomCountry ? 'Otro' : form.country}
            onChange={e => {
              const v = e.target.value;
              if (v === 'Otro') { setShowCustomCountry(true); setForm(f => ({ ...f, country: '' })); }
              else { setShowCustomCountry(false); setForm(f => ({ ...f, country: v })); }
            }}
          >
            <option value="">Seleccionar...</option>
            {COUNTRY_PRESETS.map(c => <option key={c} value={c}>{c}</option>)}
            <option value="Otro">Otro</option>
          </select>
          {showCustomCountry && (
            <input
              value={form.country}
              onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
              className={`${inputCls} mt-2`}
              placeholder="Nombre del país"
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Dirección fiscal</label>
          <input value={form.fiscalAddress} onChange={e => setForm(f => ({ ...f, fiscalAddress: e.target.value }))} className={inputCls} placeholder="Av. / Calle / Ciudad" />
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowBanking(v => !v)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-600 transition-colors"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showBanking ? 'rotate-180' : ''}`} />
          Datos bancarios (opcional)
        </button>
        {showBanking && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className={labelCls}>Banco</label>
              <input value={form.banco} onChange={e => setForm(f => ({ ...f, banco: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Cuenta</label>
              <input value={form.cuenta} onChange={e => setForm(f => ({ ...f, cuenta: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>CCI</label>
              <input value={form.cci} onChange={e => setForm(f => ({ ...f, cci: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>IBAN</label>
              <input value={form.iban} onChange={e => setForm(f => ({ ...f, iban: e.target.value }))} className={inputCls} />
            </div>
            <div className="col-span-2">
              <label className={labelCls}>SWIFT / BIC</label>
              <input value={form.swift} onChange={e => setForm(f => ({ ...f, swift: e.target.value }))} className={inputCls} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
