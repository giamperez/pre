import { X, Trash2, Calendar, User, Mail, Phone, Briefcase, Send, AlertCircle, MessageSquare, DollarSign } from 'lucide-react';
import type { Company, ServiceItem } from '../types';
import { API_URL } from '../config';

interface QuoteSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  submitting: boolean;
  company: Company;
  selectedMainService: ServiceItem | null;
  selectedAddonItems: ServiceItem[];
  onRemoveMainService: () => void;
  onRemoveAddon: (id: string) => void;
  formData: {
    name: string;
    businessName: string;
    phone: string;
    email: string;
    notes?: string;
    budget?: string;
  };
  booking: { date: string; time: string } | null;
  isSubmitted?: boolean;
}

export function QuoteSummaryModal({
  isOpen,
  onClose,
  onConfirm,
  submitting,
  company,
  selectedMainService,
  selectedAddonItems,
  onRemoveMainService,
  onRemoveAddon,
  formData,
  booking,
  isSubmitted = false,
}: QuoteSummaryModalProps) {
  if (!isOpen) return null;

  const subtotal =
    (selectedMainService ? selectedMainService.basePrice : 0) +
    selectedAddonItems.reduce((sum, item) => sum + item.basePrice, 0);
  const igv = subtotal * 0.18;
  const total = subtotal + igv;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            {company.logoUrl ? (
              <img
                src={company.logoUrl.startsWith('http') ? company.logoUrl : `${API_URL}/public${company.logoUrl}`}
                alt={company.name}
                className="h-8 object-contain"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: company.colorPrimary }}
              >
                {company.name.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">
                {isSubmitted ? '¡Cotización Solicitada!' : 'Resumen de tu Cotización'}
              </h2>
              <p className="text-xs text-slate-500">
                {isSubmitted ? 'Tus datos se registraron con éxito. Aquí tienes el monto estimado:' : 'Verifica los productos solicitados antes de enviar'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Selected Main Service */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Servicio Principal
            </h3>
            {selectedMainService ? (
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-start justify-between gap-3 relative group">
                <div className="flex-1 pr-2">
                  <h4 className="font-semibold text-slate-800 mb-1">{selectedMainService.name}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-2">{selectedMainService.description}</p>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedMainService.currency} {selectedMainService.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onRemoveMainService}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-colors shrink-0 self-start"
                  title="Eliminar servicio principal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 flex items-center gap-3 text-amber-800 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>No has seleccionado ningún servicio principal. Debes seleccionar uno para enviar la solicitud.</span>
              </div>
            )}
          </div>

          {/* Selected Addon Services */}
          {selectedAddonItems.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Servicios Adicionales ({selectedAddonItems.length})
              </h3>
              <div className="space-y-3">
                {selectedAddonItems.map(addon => (
                  <div key={addon.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-800 text-sm mb-0.5">{addon.name}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-1.5">{addon.description}</p>
                      <span className="text-xs font-semibold text-slate-700">
                        + {addon.currency} {addon.basePrice.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onRemoveAddon(addon.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                      title="Eliminar este servicio adicional"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booking Info if selected */}
          {booking && (
            <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center gap-3">
              <Calendar className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-900">Reunión Agendada</p>
                <p className="text-emerald-700">{booking.date} a las {booking.time}</p>
              </div>
            </div>
          )}

          {/* Contact info summary */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2 text-xs text-slate-600">
            <p className="font-bold uppercase tracking-wider text-slate-400 mb-2">Datos de Solicitante</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate font-medium text-slate-700">{formData.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate font-medium text-slate-700">{formData.email}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-medium text-slate-700">{formData.phone}</span>
              </div>
              {formData.businessName && (
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate font-medium text-slate-700">{formData.businessName}</span>
                </div>
              )}
              {formData.budget && (
                <div className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate font-medium text-slate-700">Presupuesto: {formData.budget}</span>
                </div>
              )}
            </div>
            {formData.notes && (
              <div className="border-t border-slate-200/60 pt-2.5 mt-2 space-y-1">
                <div className="flex items-start gap-1.5 text-slate-600">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold text-slate-700 block text-xs">Detalles del proyecto:</span>
                    <p className="text-slate-600 italic whitespace-pre-wrap leading-relaxed">{formData.notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Totals Breakdown */}
          <div className="border-t border-slate-200 pt-4 space-y-2">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal:</span>
              <span className="font-medium text-slate-800">PEN {subtotal.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>IGV (18%):</span>
              <span className="font-medium text-slate-800">PEN {igv.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between font-bold text-sm sm:text-base pt-2 border-t border-slate-100 items-center">
              <span className="text-slate-800">Cotización Estimada (Inc. IGV):</span>
              <span className="text-base sm:text-lg font-black" style={{ color: company.colorPrimary }}>
                PEN {total.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
              <p>
                <strong>Nota:</strong> Esta es una estimación basada en la información proporcionada. El precio final puede variar después de la reunión de levantamiento de requerimientos.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-2.5 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Modificar Selección
          </button>
          <button
            type="button"
            disabled={!selectedMainService || submitting}
            onClick={onConfirm}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            style={{ backgroundColor: (!selectedMainService || submitting) ? '#94a3b8' : company.colorPrimary }}
          >
            {submitting ? 'Enviando...' : (
              <>
                Confirmar y Enviar
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
