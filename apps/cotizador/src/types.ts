export interface CompanyPaymentInfo {
  banco?: string;
  cuenta?: string;
  cci?: string;
  iban?: string;
  swift?: string;
  [key: string]: unknown;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  colorPrimary: string;
  colorSecondary: string;
  contactPhone: string;
  contactEmail: string;
  isActive?: boolean;
  legalName?: string | null;
  taxId?: string | null;
  country?: string | null;
  legalEntityType?: string | null;
  fiscalAddress?: string | null;
  coverImageUrl?: string | null;
  backCoverImageUrl?: string | null;
  letterheadUrl?: string | null;
  paymentInfo?: CompanyPaymentInfo | null;
}

export interface QuoteItem {
  titulo?: string;
  contenido?: string;
  detalle: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
}

export interface ClientData {
  empresa: string;
  ruc?: string;
  solicitante: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
}

export interface ProjectData {
  nombre: string;
  modalidad?: string;
  plazo?: string;
}

export interface Quote {
  id: string;
  number: string;
  companyId: string;
  company?: Company;
  clientData: ClientData;
  projectData: ProjectData;
  items: QuoteItem[];
  additionalItems?: QuoteItem[];
  subtotal: number;
  igv: number;
  total: number;
  considerations?: string;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export type LeadClassification = 'calificado' | 'no_calificado' | 'pendiente';

export interface Lead {
  id: string;
  companyId: string;
  name: string;
  businessName?: string;
  phone?: string;
  email?: string;
  source?: string;
  answers?: any;
  classification: LeadClassification;
  notes?: string;
  company?: Company;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppSessionStatus = 'disconnected' | 'qr_pending' | 'connecting' | 'connected';

export interface WhatsAppSession {
  id?: string;
  companyId: string;
  status: WhatsAppSessionStatus;
  qrCode?: string | null;
  phoneNumber?: string | null;
  disconnectReason?: string | null;
  lastConnectedAt?: string | null;
  lastDisconnectedAt?: string | null;
}

export interface WhatsAppChat {
  id: string;
  companyId: string;
  sessionId: string;
  waJid: string;
  contactName?: string | null;
  leadId?: string | null;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  unreadCount: number;
}

export interface WhatsAppMessage {
  id: string;
  chatId: string;
  direction: 'in' | 'out';
  body: string;
  status: string;
  createdAt: string;
}
