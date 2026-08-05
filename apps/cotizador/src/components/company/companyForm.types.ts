export interface CompanyFormState {
  name: string;
  slug: string;
  colorPrimary: string;
  colorSecondary: string;
  contactPhone: string;
  contactEmail: string;
  legalName: string;
  taxId: string;
  country: string;
  legalEntityType: string;
  fiscalAddress: string;
  banco: string;
  cuenta: string;
  cci: string;
  iban: string;
  swift: string;
}

export function emptyCompanyForm(): CompanyFormState {
  return {
    name: '', slug: '', colorPrimary: '#4f46e5', colorSecondary: '#0ea5e9',
    contactPhone: '', contactEmail: '',
    legalName: '', taxId: '', country: '', legalEntityType: '', fiscalAddress: '',
    banco: '', cuenta: '', cci: '', iban: '', swift: '',
  };
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
