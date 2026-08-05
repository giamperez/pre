export interface Option {
  value: string;
  label: string;
}

export const VERTEX_SLUG = 'vertex-developers';
export const PYRAMID_SLUG = 'pyramid-structures';

export const TIPOS_SERVICIO_POR_EMPRESA: Record<string, Option[]> = {
  [PYRAMID_SLUG]: [
    { value: 'Diseño estructural', label: 'Diseño estructural' },
    { value: 'Revisión', label: 'Revisión' },
    { value: 'Inspección y evaluación', label: 'Inspección y evaluación' },
    { value: 'Construcción', label: 'Construcción' },
    { value: 'Costos y presupuestos', label: 'Costos y presupuestos' },
    { value: 'Otro', label: 'Otro' },
  ],
  [VERTEX_SLUG]: [
    { value: 'Landing page / Sitio corporativo', label: 'Landing page / Sitio corporativo' },
    { value: 'Web con catálogo', label: 'Web con catálogo' },
    { value: 'E-commerce', label: 'E-commerce' },
    { value: 'Software / SaaS a medida', label: 'Software / SaaS a medida' },
    { value: 'App móvil', label: 'App móvil' },
    { value: 'Otro', label: 'Otro' },
  ],
};

export const TIPOS_PROYECTO_POR_EMPRESA: Record<string, Option[]> = {
  [PYRAMID_SLUG]: [
    { value: 'Edificio', label: 'Edificio' },
    { value: 'Nave industrial', label: 'Nave industrial' },
    { value: 'Vivienda unifamiliar', label: 'Vivienda unifamiliar' },
    { value: 'Puente', label: 'Puente' },
    { value: 'Otro', label: 'Otro' },
  ],
};

function dedupeByValue(options: Option[]): Option[] {
  const seen = new Set<string>();
  return options.filter((o) => (seen.has(o.value) ? false : (seen.add(o.value), true)));
}

export const TODOS_LOS_TIPOS_SERVICIO: Option[] = dedupeByValue(
  Object.values(TIPOS_SERVICIO_POR_EMPRESA).flat(),
);

export function getTiposServicio(companySlug?: string | null): Option[] {
  if (companySlug && TIPOS_SERVICIO_POR_EMPRESA[companySlug]) {
    return TIPOS_SERVICIO_POR_EMPRESA[companySlug];
  }
  return TODOS_LOS_TIPOS_SERVICIO;
}

export function getTiposProyecto(companySlug?: string | null): Option[] {
  if (companySlug && TIPOS_PROYECTO_POR_EMPRESA[companySlug]) {
    return TIPOS_PROYECTO_POR_EMPRESA[companySlug];
  }
  return [];
}
