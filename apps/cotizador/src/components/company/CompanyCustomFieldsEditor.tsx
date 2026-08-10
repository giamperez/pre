import { useState } from 'react';
import { Plus, Trash2, Sliders, Type, List, Hash, AlignLeft, CheckSquare } from 'lucide-react';

export interface CustomFieldDefinition {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number' | 'checkbox';
  category: 'client' | 'project';
  options?: string[];
  required?: boolean;
}

interface Props {
  customFields: CustomFieldDefinition[];
  onChange: (fields: CustomFieldDefinition[]) => void;
  hideCategory?: boolean;
  heading?: string;
  description?: string;
  emptyLabel?: string;
}

const emptyField = (): CustomFieldDefinition => ({
  id: 'field_' + Math.random().toString(36).slice(2, 9),
  label: '',
  type: 'text',
  category: 'project',
  options: ['Opción 1', 'Opción 2'],
  required: false,
});

export function CompanyCustomFieldsEditor({
  customFields,
  onChange,
  hideCategory = false,
  heading = 'Campos Complementarios Personalizados',
  description = 'Diseña cuadros de texto, números y desplegables para tus cotizaciones',
  emptyLabel = 'No hay campos personalizados adicionales configurados en esta plantilla.',
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const addField = () => {
    const f = emptyField();
    onChange([...customFields, f]);
    setEditingId(f.id);
  };

  const removeField = (id: string) => {
    onChange(customFields.filter(f => f.id !== id));
  };

  const updateField = (id: string, updates: Partial<CustomFieldDefinition>) => {
    onChange(customFields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const addOption = (id: string) => {
    onChange(customFields.map(f => {
      if (f.id === id) {
        const opts = f.options || [];
        return { ...f, options: [...opts, `Opción ${opts.length + 1}`] };
      }
      return f;
    }));
  };

  const updateOption = (id: string, idx: number, val: string) => {
    onChange(customFields.map(f => {
      if (f.id === id) {
        const opts = [...(f.options || [])];
        opts[idx] = val;
        return { ...f, options: opts };
      }
      return f;
    }));
  };

  const removeOption = (id: string, idx: number) => {
    onChange(customFields.map(f => {
      if (f.id === id) {
        const opts = (f.options || []).filter((_, i) => i !== idx);
        return { ...f, options: opts };
      }
      return f;
    }));
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'client') return 'Datos del Cliente';
    return 'Datos del Proyecto';
  };

  return (
    <div className="space-y-4 pt-4 border-t border-slate-100">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-indigo-600" />
            {heading}
          </h4>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <button
          type="button"
          onClick={addField}
          className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar Campo
        </button>
      </div>

      {customFields.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400">{emptyLabel}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customFields.map(f => {
            const isEditing = editingId === f.id;
            return (
              <div key={f.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 flex-wrap">
                    {f.type === 'text' && <Type className="w-4 h-4 text-slate-400" />}
                    {f.type === 'textarea' && <AlignLeft className="w-4 h-4 text-slate-400" />}
                    {f.type === 'number' && <Hash className="w-4 h-4 text-slate-400" />}
                    {f.type === 'select' && <List className="w-4 h-4 text-indigo-500" />}
                    {f.type === 'checkbox' && <CheckSquare className="w-4 h-4 text-emerald-500" />}
                    <span className="text-sm font-semibold text-slate-700">
                      {f.label || 'Campo sin nombre'}
                    </span>
                    {!hideCategory && (
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                        {getCategoryLabel(f.category)}
                      </span>
                    )}
                    <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
                      {f.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingId(isEditing ? null : f.id)}
                      className="text-xs text-indigo-600 hover:underline font-medium"
                    >
                      {isEditing ? 'Listo' : 'Editar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeField(f.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="pt-2 border-t border-slate-200 space-y-3 bg-white p-3 rounded-lg border border-slate-100">
                    <div className={`grid grid-cols-1 gap-3 ${hideCategory ? '' : 'sm:grid-cols-3'}`}>
                      <div className={hideCategory ? '' : 'sm:col-span-2'}>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nombre / Etiqueta del campo</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-indigo-300 outline-none"
                          placeholder="Ej: DNI Solicitante, Plazo Estimado..."
                          value={f.label}
                          onChange={e => updateField(f.id, { label: e.target.value })}
                        />
                      </div>
                      {!hideCategory && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 mb-1">Ubicación en Cotización</label>
                          <select
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                            value={f.category}
                            onChange={e => updateField(f.id, { category: e.target.value as 'client' | 'project' })}
                          >
                            <option value="client">Datos del Cliente</option>
                            <option value="project">Datos del Proyecto</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Tipo de Entrada</label>
                        <select
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
                          value={f.type}
                          onChange={e => updateField(f.id, { type: e.target.value as any })}
                        >
                          <option value="text">Cuadro de texto simple</option>
                          <option value="textarea">Área de texto multilinea</option>
                          <option value="number">Número</option>
                          <option value="select">Desplegable (Lista de Opciones)</option>
                          <option value="checkbox">Casilla de verificación (Checkbox)</option>
                        </select>
                      </div>
                      <div className="flex items-end pb-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                          <input
                            type="checkbox"
                            checked={f.required}
                            onChange={e => updateField(f.id, { required: e.target.checked })}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Campo obligatorio
                        </label>
                      </div>
                    </div>

                    {f.type === 'select' && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <label className="block text-xs font-bold text-slate-600">Opciones del Desplegable</label>
                        <div className="space-y-1.5">
                          {(f.options || []).map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                className="flex-1 border border-slate-200 rounded-md px-2 py-1 text-xs outline-none focus:border-indigo-400"
                                value={opt}
                                onChange={e => updateOption(f.id, oIdx, e.target.value)}
                              />
                              {(f.options?.length || 0) > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeOption(f.id, oIdx)}
                                  className="text-slate-400 hover:text-red-500 p-1"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addOption(f.id)}
                          className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1 pt-1"
                        >
                          <Plus className="w-3 h-3" /> Agregar otra opción
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
