export interface CompanyBase {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  colorPrimary?: string;
  colorSecondary?: string;
}

export interface CatalogItemBase {
  id: string;
  companyId: string;
  category: string;
  name: string;
  description?: string;
  basePrice: number;
  isAddon: boolean;
  currency: string;
}

export enum LeadClassification {
  CALIFICADO = 'calificado',
  NO_CALIFICADO = 'no_calificado',
  PENDIENTE = 'pendiente'
}
