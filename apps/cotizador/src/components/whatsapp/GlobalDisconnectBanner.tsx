import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { useWhatsapp } from '../../whatsapp-context';

export function GlobalDisconnectBanner() {
  const { session } = useWhatsapp();

  // Solo alerta si hubo un vínculo previo (evita mostrar el banner antes de configurar WhatsApp por primera vez)
  const wasLinked = Boolean(session?.phoneNumber || session?.disconnectReason);
  if (!session || session.status !== 'disconnected' || !wasLinked) return null;

  return (
    <div className="bg-red-600 text-white px-4 sm:px-6 py-2 flex items-center justify-center gap-2 text-sm font-medium sticky top-[57px] z-10">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>La sesión de WhatsApp se desconectó. Un administrador debe volver a escanear el código QR.</span>
      <Link to="/whatsapp" className="underline font-semibold hover:opacity-90">
        Ir a WhatsApp
      </Link>
    </div>
  );
}
