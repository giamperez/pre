import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { io, type Socket } from 'socket.io-client';
import { API_URL } from './config';
import { getToken } from './auth';
import type { WhatsAppSession } from './types';

const SELECTED_COMPANY_KEY = 'wa_selected_company';

interface WhatsappContextValue {
  companyId: string | null;
  setCompanyId: (companyId: string | null) => void;
  session: WhatsAppSession | null;
  socket: Socket | null;
}

const WhatsappContext = createContext<WhatsappContextValue>({
  companyId: null,
  setCompanyId: () => {},
  session: null,
  socket: null,
});

export function WhatsappProvider({ children }: { children: ReactNode }) {
  const [companyId, setCompanyIdState] = useState<string | null>(() => localStorage.getItem(SELECTED_COMPANY_KEY));
  const [session, setSession] = useState<WhatsAppSession | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  const setCompanyId = (id: string | null) => {
    setCompanyIdState(id);
    if (id) localStorage.setItem(SELECTED_COMPANY_KEY, id);
    else localStorage.removeItem(SELECTED_COMPANY_KEY);
  };

  useEffect(() => {
    if (!companyId) {
      setSession(null);
      return;
    }

    const token = getToken();
    if (!token) return;

    fetch(`${API_URL}/whatsapp/${companyId}/status`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setSession(data))
      .catch(() => {});

    const socketInstance = io(`${API_URL}/ws/whatsapp`, {
      auth: { companyId, token },
      transports: ['websocket'],
    });

    socketInstance.on('whatsapp:status', (data: WhatsAppSession) => setSession(data));
    socketInstance.on('whatsapp:qr', (data: { qrCode: string }) =>
      setSession((prev) => (prev ? { ...prev, qrCode: data.qrCode, status: 'qr_pending' } : prev)),
    );

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setSocket(null);
    };
  }, [companyId]);

  return (
    <WhatsappContext.Provider value={{ companyId, setCompanyId, session, socket }}>
      {children}
    </WhatsappContext.Provider>
  );
}

export function useWhatsapp() {
  return useContext(WhatsappContext);
}
