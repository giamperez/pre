// Helpers para autenticación JWT en el cotizador

const TOKEN_KEY = 'cotizador_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    // Decodifica el payload del JWT (sin verificar firma — eso lo hace el backend)
    const payload = JSON.parse(atob(token.split('.')[1]));
    // Verifica que no haya expirado
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUser(): { userId: string; email: string; name: string; role: string } | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { userId: payload.sub, email: payload.email, name: payload.name, role: payload.role };
  } catch {
    return null;
  }
}

export function logout(): void {
  removeToken();
  window.location.href = '/login';
}

// fetch con Authorization header automático y manejo de 401
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    logout();
    throw new Error('Sesión expirada. Inicia sesión nuevamente.');
  }
  return res;
}
