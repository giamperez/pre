export interface Company {
  id: string;
  name: string;
  slug: string;
  logoUrl: string;
  colorPrimary: string;
  colorSecondary: string;
  contactPhone: string;
  contactEmail: string;
}

export interface QuoteItem {
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
