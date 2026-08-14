import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_URL } from '../config';
import { fetchWithAuth } from '../auth';
import type { ContractDocument } from '../types';
import { SignatureCanvasModal } from '../components/contracts/SignatureCanvasModal';
import { ContractAuditModal } from '../components/contracts/ContractAuditModal';
import {
  ArrowLeft, Save, Lock, PenTool, ExternalLink, ShieldCheck, Bold, Italic, List, ListOrdered, Heading1, Heading2,
  Tag, AlertTriangle, FileText, Shield, Layers
} from 'lucide-react';

export function ContractEditorPage() {
  const { contractId } = useParams();

  const [contract, setContract] = useState<ContractDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [auditModalOpen, setAuditModalOpen] = useState(false);

  const [contentHtml, setContentHtml] = useState('');
  const [providerSig, setProviderSig] = useState<string | null>(null);
  const [clientSig, setClientSig] = useState<string | null>(null);

  const [activeSigModal, setActiveSigModal] = useState<'provider' | 'client' | null>(null);

  const editorRef = useRef<HTMLDivElement>(null);

  const loadContract = () => {
    if (!contractId) return;

    setLoading(true);
    fetchWithAuth(`${API_URL}/contracts/${contractId}`)
      .then(res => {
        if (!res.ok) throw new Error('Documento no encontrado');
        return res.json();
      })
      .then(data => {
        setContract(data);
        setContentHtml(data.contentHtml || '');
        setProviderSig(data.providerSignature || null);
        setClientSig(data.clientSignature || null);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || 'Error al cargar el documento');
        setLoading(false);
      });
  };

  useEffect(() => {
    loadContract();
  }, [contractId]);

  // Sync editor innerHTML when content loaded or document version changes
  useEffect(() => {
    if (editorRef.current && contentHtml && !loading) {
      if (editorRef.current.innerHTML !== contentHtml && document.activeElement !== editorRef.current) {
        editorRef.current.innerHTML = contentHtml;
      }
    }
  }, [loading, contract?.id, contract?.version]);

  const isLocked = Boolean(contract?.isLocked);

  const execCmd = (cmd: string, value: string = '') => {
    if (isLocked) return;
    document.execCommand(cmd, false, value);
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const insertTag = (tag: string) => {
    if (isLocked) return;
    document.execCommand('insertText', false, tag);
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setContentHtml(editorRef.current.innerHTML);
    }
  };

  const handleSaveDraft = async () => {
    if (isLocked || !contract) return;
    setSaving(true);
    try {
      const updatedHtml = editorRef.current ? editorRef.current.innerHTML : contentHtml;
      const res = await fetchWithAuth(`${API_URL}/contracts/${contract.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentHtml: updatedHtml,
          providerSignature: providerSig,
          clientSignature: clientSig,
        }),
      });

      if (!res.ok) throw new Error('Error al guardar borrador');
      const updated = await res.json();
      setContract(updated);
      alert('Borrador guardado con éxito');
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewVersion = async () => {
    if (!contractId || !contract) return;
    const nextVer = `${parseInt(contract.version?.split('.')[0] || '1', 10) + 1}.0`;
    if (!window.confirm(`¿Deseas habilitar la Versión v${nextVer} para editar este contrato y realizar adendas?`)) return;

    try {
      const res = await fetchWithAuth(`${API_URL}/contracts/${contractId}/new-version`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Error al generar la nueva versión');
      loadContract();
    } catch (err: any) {
      alert(err.message || 'No se pudo crear la nueva versión');
    }
  };

  const handleFinalizeAndLock = async () => {
    if (isLocked || !contract) return;
    const confirmLock = window.confirm(
      '¿Estás seguro de emitir y congelar este documento?\nUna vez emitido, el contrato quedará BLOQUEADO en modo INMUTABLE y no se podrá modificar.'
    );
    if (!confirmLock) return;

    setFinalizing(true);
    try {
      const updatedHtml = editorRef.current ? editorRef.current.innerHTML : contentHtml;
      const res = await fetchWithAuth(`${API_URL}/contracts/${contract.id}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentHtml: updatedHtml,
          providerSignature: providerSig,
          clientSignature: clientSig,
        }),
      });

      if (!res.ok) throw new Error('Error al emitir el documento');
      const lockedContract = await res.json();
      setContract(lockedContract);
      alert('¡Documento emitido y bloqueado con éxito! Se ha generado el PDF inmutable.');
    } catch (err: any) {
      alert(err.message || 'Error al emitir documento');
    } finally {
      setFinalizing(false);
    }
  };

  const openPdf = async () => {
    if (!contractId) return;
    const res = await fetchWithAuth(`${API_URL}/contracts/${contractId}/pdf`);
    if (!res.ok) return alert('Error al generar PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="max-w-xl mx-auto p-6 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 mx-auto mb-2 text-red-500" />
        <h3 className="font-bold text-lg">Error al cargar documento</h3>
        <p className="text-sm mt-1 mb-4">{error || 'No se encontró el contrato'}</p>
        <Link to="/contratos" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold">
          <ArrowLeft className="w-4 h-4" /> Volver a Contratos
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/contratos"
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors shadow-xs shrink-0"
            title="Volver al listado"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">{contract.title}</h1>
              <span className="px-2 py-0.5 bg-slate-900 text-white rounded text-[11px] font-mono font-bold shrink-0">
                v{contract.version || '1.0'}
              </span>
              {isLocked ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                  <Lock className="w-3 h-3" /> Inmutable / Emitido
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                  <FileText className="w-3 h-3" /> Borrador Editable
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Número: <strong className="text-slate-700">{contract.number}</strong> • Versión: <strong className="text-slate-700">v{contract.version || '1.0'}</strong> • Total: <span className="font-semibold text-slate-900">S/ {contract.totalAmount.toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={() => setAuditModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-xs font-semibold transition-colors"
            title="Ver historial de auditoría y versiones"
          >
            <Shield className="w-4 h-4 text-indigo-600" />
            Auditoría
          </button>

          <button
            onClick={openPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Ver PDF
          </button>

          {isLocked && (
            <button
              onClick={handleCreateNewVersion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold transition-colors"
              title="Habilitar una versión posterior (v2.0, v3.0...) para realizar adendas"
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              Crear Versión v{parseInt(contract.version?.split('.')[0] || '1', 10) + 1}.0
            </button>
          )}

          {!isLocked && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Guardando…' : 'Guardar Borrador'}
              </button>

              <button
                onClick={handleFinalizeAndLock}
                disabled={finalizing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                {finalizing ? 'Emitiendo…' : 'Emitir y Bloquear (PDF Final)'}
              </button>
            </>
          )}
        </div>
      </div>

      {isLocked && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-xs">
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <p className="font-bold">Documento Inmutable y Bloqueado (Versión v{contract.version || '1.0'})</p>
              <p className="text-emerald-700">Este contrato ha sido oficialmente emitido en su versión v{contract.version || '1.0'}. Si requieres realizar adendas o modificaciones, puedes generar la Versión v{parseInt(contract.version?.split('.')[0] || '1', 10) + 1}.0.</p>
            </div>
          </div>
          <button
            onClick={handleCreateNewVersion}
            className="shrink-0 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Layers className="w-4 h-4" />
            Habilitar v{parseInt(contract.version?.split('.')[0] || '1', 10) + 1}.0
          </button>
        </div>
      )}

      {/* Editor Main Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden mb-8">
        {/* Editor Toolbar (Disabled if locked) */}
        {!isLocked && (
          <div className="bg-slate-900 text-white p-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            {/* Formatting Actions */}
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => execCmd('bold')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Negrita">
                <Bold className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => execCmd('italic')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Cursiva">
                <Italic className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <button type="button" onClick={() => execCmd('insertUnorderedList')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Lista viñetas">
                <List className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => execCmd('insertOrderedList')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Lista numerada">
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="w-px h-5 bg-slate-700 mx-1" />
              <button type="button" onClick={() => execCmd('formatBlock', '<h1>')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Título H1">
                <Heading1 className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => execCmd('formatBlock', '<h2>')} className="p-1.5 hover:bg-slate-800 rounded text-slate-300 hover:text-white" title="Título H2">
                <Heading2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Word-like Canvas */}
        <div className="p-8 sm:p-12 bg-white min-h-[500px]">
          <div
            ref={editorRef}
            contentEditable={!isLocked}
            onInput={handleEditorInput}
            className={`outline-none min-h-[450px] text-slate-800 leading-relaxed font-sans ${
              isLocked ? 'cursor-default' : 'cursor-text focus:ring-0'
            }`}
          />
        </div>
      </div>

      {/* Signature Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
          <PenTool className="w-5 h-5 text-indigo-600" />
          Sección de Firmas Digitales
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Dibuja o modifica las firmas a mano alzada para plasmar en el documento oficial
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Provider Signature Card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-between text-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Firma del Proveedor</h4>
            <div className="w-full h-32 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden mb-4 p-2">
              {providerSig ? (
                <img src={providerSig} alt="Firma Proveedor" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Sin firma registrada</span>
              )}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => setActiveSigModal('provider')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <PenTool className="w-3.5 h-3.5" />
                {providerSig ? 'Cambiar Firma' : 'Dibujar Firma'}
              </button>
            )}
          </div>

          {/* Client Signature Card */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col items-center justify-between text-center">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">Firma del Cliente</h4>
            <div className="w-full h-32 bg-white rounded-xl border border-dashed border-slate-300 flex items-center justify-center overflow-hidden mb-4 p-2">
              {clientSig ? (
                <img src={clientSig} alt="Firma Cliente" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-xs text-slate-400">Sin firma registrada</span>
              )}
            </div>
            {!isLocked && (
              <button
                type="button"
                onClick={() => setActiveSigModal('client')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                <PenTool className="w-3.5 h-3.5" />
                {clientSig ? 'Cambiar Firma' : 'Dibujar Firma'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Signature Canvas Modal */}
      {activeSigModal && (
        <SignatureCanvasModal
          isOpen={Boolean(activeSigModal)}
          onClose={() => setActiveSigModal(null)}
          title={activeSigModal === 'provider' ? 'Firma Digital del Proveedor' : 'Firma Digital del Cliente'}
          initialSignature={activeSigModal === 'provider' ? providerSig || undefined : clientSig || undefined}
          onSave={(dataUrl) => {
            if (activeSigModal === 'provider') setProviderSig(dataUrl);
            if (activeSigModal === 'client') setClientSig(dataUrl);
          }}
        />
      )}

      {/* Contract Audit Modal */}
      <ContractAuditModal
        isOpen={auditModalOpen}
        onClose={() => setAuditModalOpen(false)}
        contractId={contract?.id}
        contractNumber={contract?.number}
        contractTitle={contract?.title}
        version={contract?.version}
      />
    </div>
  );
}
