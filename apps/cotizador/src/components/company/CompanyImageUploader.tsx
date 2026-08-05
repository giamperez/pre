import { useRef, useState } from 'react';
import { ImagePlus, ShieldAlert, UploadCloud, Loader2 } from 'lucide-react';
import { API_URL } from '../../config';
import { fetchWithAuth } from '../../auth';
import type { Company } from '../../types';

type SlotField = 'logo' | 'portada' | 'contraportada' | 'membrete';

const SLOTS: { field: SlotField; label: string; urlKey: keyof Company; hint: string }[] = [
  { field: 'logo', label: 'Logo', urlKey: 'logoUrl', hint: 'Se muestra en la app' },
  { field: 'portada', label: 'Portada', urlKey: 'coverImageUrl', hint: 'Primera página del PDF' },
  { field: 'contraportada', label: 'Contraportada', urlKey: 'backCoverImageUrl', hint: 'Última página del PDF' },
  { field: 'membrete', label: 'Membrete', urlKey: 'letterheadUrl', hint: 'Fondo de páginas internas del PDF' },
];

function ImageSlot({
  slot,
  company,
  file,
  onSelect,
}: {
  slot: typeof SLOTS[number];
  company: Company;
  file: File | null;
  onSelect: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const existingUrl = company[slot.urlKey] as string | null | undefined;
  const previewSrc = file ? URL.createObjectURL(file) : existingUrl ? `${API_URL}/public${existingUrl}` : null;

  return (
    <div className="border border-slate-200 rounded-xl p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{slot.label}</p>
        <p className="text-[11px] text-slate-400">{slot.hint}</p>
      </div>
      <div className="h-24 rounded-lg border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
        {previewSrc ? (
          <img src={previewSrc} alt={slot.label} className="max-h-full max-w-full object-contain" />
        ) : (
          <ImagePlus className="w-6 h-6 text-slate-300" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => onSelect(e.target.files?.[0] || null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors text-left"
      >
        {file ? `Seleccionado: ${file.name}` : existingUrl ? 'Cambiar imagen' : 'Elegir imagen'}
      </button>
    </div>
  );
}

export function CompanyImageUploader({ company, onUploaded }: { company: Company; onUploaded: (company: Company) => void }) {
  const [pending, setPending] = useState<Partial<Record<SlotField, File>>>({});
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSelect = (field: SlotField, file: File | null) => {
    setSuccess(false);
    setPending(prev => {
      const next = { ...prev };
      if (file) next[field] = file;
      else delete next[field];
      return next;
    });
  };

  const pendingCount = Object.keys(pending).length;

  const handleUpload = async () => {
    if (pendingCount === 0) return;
    setUploading(true);
    setError('');
    try {
      const formData = new FormData();
      (Object.entries(pending) as [SlotField, File][]).forEach(([field, file]) => formData.append(field, file));
      const res = await fetchWithAuth(`${API_URL}/companies/${company.id}/images`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.message || 'Error al subir las imágenes');
      }
      const updated = await res.json();
      onUploaded(updated);
      setPending({});
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {SLOTS.map(slot => (
          <ImageSlot
            key={slot.field}
            slot={slot}
            company={company}
            file={pending[slot.field] || null}
            onSelect={file => handleSelect(slot.field, file)}
          />
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && !error && (
        <p className="text-sm text-green-600">Imágenes actualizadas.</p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={pendingCount === 0 || uploading}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-40"
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        {uploading ? 'Subiendo...' : pendingCount > 0 ? `Subir ${pendingCount} imagen${pendingCount > 1 ? 'es' : ''}` : 'Subir imágenes'}
      </button>
    </div>
  );
}
