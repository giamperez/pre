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

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  isAddon: boolean;
  category: string;
  currency: string;
}
