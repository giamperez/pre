import { Sparkles, CheckCircle, Lightbulb, FileText } from 'lucide-react';

interface AiAnalysisCardProps {
  analysis: {
    mainServiceName?: string;
    summary?: string;
    explanation?: string;
    addonNames?: string[];
  };
  onClear?: () => void;
}

const renderFormattedContent = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className="font-bold text-cyan-300">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

export function AiAnalysisCard({ analysis, onClear }: AiAnalysisCardProps) {
  if (!analysis || (!analysis.summary && !analysis.explanation)) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-xl border border-indigo-500/30 my-8 relative overflow-hidden animate-fadeIn z-0">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-0">
        <div className="flex items-center justify-between gap-3 pb-4 border-b border-indigo-500/20 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">Análisis Inteligente de tu Proyecto</h3>
                <span className="text-[10px] font-semibold bg-cyan-400/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-400/30">
                  Resumen Simplificado
                </span>
              </div>
              <p className="text-xs text-indigo-200">Generado por el Asistente Virtual para ayudarte a entender tu cotización</p>
            </div>
          </div>
          {onClear && (
            <button
              onClick={onClear}
              className="text-xs text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
            >
              Reajustar selección
            </button>
          )}
        </div>

        {analysis.mainServiceName && (
          <div className="bg-slate-800/50 backdrop-blur border border-indigo-400/20 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold text-sm mb-1">
              <CheckCircle className="w-4 h-4 text-cyan-400" />
              <span>Opción Principal Seleccionada</span>
            </div>
            <p className="text-white font-bold text-base">{renderFormattedContent(analysis.mainServiceName)}</p>
            {analysis.addonNames && analysis.addonNames.length > 0 && (
              <div className="mt-2 pt-2 border-t border-slate-700/60 flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-400 mr-1">Complementos incluidos:</span>
                {analysis.addonNames.map((addon, idx) => (
                  <span key={idx} className="text-xs bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 px-2 py-0.5 rounded-md">
                    +{renderFormattedContent(addon)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {analysis.explanation && (
          <div className="space-y-3 text-sm text-indigo-100 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <Lightbulb className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-300 mb-1 text-xs uppercase tracking-wider">¿Por qué es ideal para ti?</h4>
                <div className="whitespace-pre-line text-slate-200 text-sm bg-slate-900/40 p-3.5 rounded-xl border border-slate-800">
                  {renderFormattedContent(analysis.explanation)}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-cyan-400" />
            <span>Los detalles han sido copiados a tus observaciones.</span>
          </div>
          <span className="font-medium text-slate-400">Solo completa tus datos abajo para finalizar</span>
        </div>
      </div>
    </div>
  );
}
