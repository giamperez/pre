import { Sparkles, CheckCircle, Lightbulb, FileText, BellRing, ArrowDown, AlertCircle } from 'lucide-react';

interface AiAnalysisCardProps {
  analysis: {
    mainServiceName?: string;
    summary?: string;
    explanation?: string;
    addonNames?: string[];
  };
  colorPrimary?: string;
  onClear?: () => void;
}

const renderFormattedContent = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export function AiAnalysisCard({ analysis, colorPrimary = '#0ea5e9', onClear }: AiAnalysisCardProps) {
  if (!analysis || (!analysis.summary && !analysis.explanation)) return null;

  return (
    <div
      className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border my-8 relative overflow-hidden animate-fadeIn"
      style={{ borderColor: `${colorPrimary}35` }}
    >
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
              style={{ backgroundColor: colorPrimary }}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg text-slate-800 tracking-tight">Análisis Inteligente de tu Proyecto</h3>
                <span
                  className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-2xs"
                  style={{ backgroundColor: `${colorPrimary}12`, color: colorPrimary, borderColor: `${colorPrimary}30` }}
                >
                  Resumen Recomendado
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Recomendación personalizada basada en tus requerimientos</p>
            </div>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors font-medium shrink-0"
            >
              Reajustar selección
            </button>
          )}
        </div>

        {/* Selected Main Service */}
        {analysis.mainServiceName && (
          <div
            className="p-4 rounded-xl border space-y-2"
            style={{ backgroundColor: `${colorPrimary}08`, borderColor: `${colorPrimary}25` }}
          >
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider" style={{ color: colorPrimary }}>
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>Opción Principal Recomendada</span>
            </div>
            <p className="text-slate-900 font-extrabold text-base sm:text-lg leading-snug">
              {renderFormattedContent(analysis.mainServiceName)}
            </p>
            {analysis.addonNames && analysis.addonNames.length > 0 && (
              <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Complementos incluidos:</span>
                {analysis.addonNames.map((addon, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-bold px-2.5 py-0.5 rounded-md border"
                    style={{ backgroundColor: '#ffffff', color: colorPrimary, borderColor: `${colorPrimary}30` }}
                  >
                    +{renderFormattedContent(addon)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Explanation / Why it's ideal */}
        {analysis.explanation && (
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wider">
              <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
              <span>¿Por qué es la mejor opción para ti?</span>
            </div>
            <div className="whitespace-pre-line text-slate-700 text-sm leading-relaxed font-medium">
              {renderFormattedContent(analysis.explanation)}
            </div>
          </div>
        )}

        {/* ALERTA DE ALTO IMPACTO ARMONIZADA CON EL TEMA */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 via-amber-100/60 to-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="w-11 h-11 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm">
            <BellRing className="w-5 h-5 animate-bounce text-slate-950" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span className="bg-amber-400 text-slate-950 font-extrabold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider shadow-2xs">
                PASO FINAL REQUERIDO
              </span>
              <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> ¡Atención!
              </span>
            </div>
            <p className="text-base font-extrabold text-slate-900 leading-snug">
              Solo completa tus datos abajo en el Paso 3 para finalizar y recibir tu cotización.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-center justify-center shrink-0">
            <ArrowDown className="w-6 h-6 text-amber-600 animate-bounce" />
          </div>
        </div>

        {/* Footer info line */}
        <div className="pt-1 text-right text-[11px] text-slate-400 font-medium">
          <FileText className="w-3.5 h-3.5 text-slate-400 inline mr-1" />
          <span>Los detalles del proyecto han sido añadidos automáticamente a tu formulario.</span>
        </div>
      </div>
    </div>
  );
}
