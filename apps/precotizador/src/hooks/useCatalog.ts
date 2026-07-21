import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import type { Company, ServiceItem } from '../types';

interface CatalogData {
  company: Company;
  catalogItems: ServiceItem[];
}

export function useCatalog(companySlug?: string) {
  const [data, setData] = useState<CatalogData | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        if (companySlug) {
          const res = await fetch(`${API_URL}/catalog/${companySlug}`);
          if (!res.ok) throw new Error('Empresa no encontrada');
          const json = await res.json();
          // The API returns the company directly with catalogItems inside
          const { catalogItems, ...companyData } = json;
          setData({ company: companyData, catalogItems: catalogItems || [] });
        } else {
          const res = await fetch(`${API_URL}/catalog`);
          if (!res.ok) throw new Error('Error al cargar empresas');
          const json = await res.json();
          setCompanies(json);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [companySlug]);

  return { company: data?.company || null, items: data?.catalogItems || [], companies, loading, error };
}
