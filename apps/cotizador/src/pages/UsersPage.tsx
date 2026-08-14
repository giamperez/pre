import { useState, useEffect } from 'react';
import { API_URL } from '../config';
import { fetchWithAuth, getUser } from '../auth';
import { Plus, Pencil, UserX, UserCheck, X, ShieldAlert, Sliders } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  companyId?: string;
  permissions?: Record<string, boolean>;
  createdAt: string;
}

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
    role === 'superadmin'
      ? 'bg-amber-100 text-amber-800 border border-amber-300'
      : role === 'admin'
      ? 'bg-indigo-100 text-indigo-700'
      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
  }`}>
    {role === 'superadmin' ? '⚡ Superadmin' : role === 'admin' ? '🛡️ Admin' : '💼 Ventas'}
  </span>
);

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
    isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
  }`}>
    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-400'}`} />
    {isActive ? 'Activo' : 'Inactivo'}
  </span>
);

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'ventas' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetchWithAuth(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || 'Error al crear usuario');
      }
      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800">Nuevo usuario</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
            <input
              required
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
              placeholder="Ej. María López"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Correo electrónico *</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
              placeholder="correo@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña * (mín. 8 caracteres)</label>
            <input
              required
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Rol</label>
            <select
              value={form.role}
              onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all bg-white"
            >
              <option value="usuario">Usuario / Ventas (Cotizaciones, Leads, Contratos)</option>
              <option value="admin">Admin (Gestión de Plantillas y Empresa)</option>
              <option value="superadmin">⚡ Superadmin (Acceso Total del Sistema)</option>
            </select>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Creando...' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CompanyItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  permissions?: Record<string, boolean>;
}

const DEFAULT_USER_PERMISSIONS: Record<string, boolean> = {
  'quotes.create': true,
  'quotes.edit': true,
  'quotes.delete': false,
  'contracts.create': true,
  'templates.edit': false,
  'leads.manage': true,
  'whatsapp.access': true,
  'precotizador.botConfig': false,
  'agenda.manage': true,
};

const DEFAULT_COMPANY_MODULES: Record<string, boolean> = {
  quotes: true,
  contracts: true,
  precotizador: true,
  whatsapp: true,
  leads: true,
  agenda: true,
  analytics: true,
};

function EditUserPermissionsModal({
  user,
  companies,
  onClose,
  onUpdated,
}: {
  user: User;
  companies: CompanyItem[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [role, setRole] = useState(user.role);
  const [assignedCompanyId, setAssignedCompanyId] = useState(user.companyId || '');
  const [userPerms, setUserPerms] = useState<Record<string, boolean>>({
    ...DEFAULT_USER_PERMISSIONS,
    ...(user.permissions as Record<string, boolean> || {}),
  });
  const [loading, setLoading] = useState(false);

  const handleTogglePerm = (key: string) => {
    setUserPerms(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_URL}/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          companyId: assignedCompanyId || null,
          permissions: userPerms,
        }),
      });
      if (!res.ok) throw new Error('Error al actualizar permisos');
      onUpdated();
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar permisos');
    } finally {
      setLoading(false);
    }
  };

  const permsList = [
    { key: 'quotes.create', label: 'Crear / Emitir Cotizaciones Formales', desc: 'Permite generar nuevas cotizaciones comerciales' },
    { key: 'quotes.edit', label: 'Editar Cotizaciones Existentes', desc: 'Permite modificar valores e ítems de cotizaciones creadas' },
    { key: 'quotes.delete', label: 'Eliminar Cotizaciones', desc: 'Permite borrar registros de cotizaciones' },
    { key: 'contracts.create', label: 'Generar Contratos Digitales', desc: 'Permite convertir cotizaciones aceptadas en contratos' },
    { key: 'templates.edit', label: 'Editar Plantillas Master (Precotización y Cotización)', desc: 'Permite modificar tarjetas, bot IA y cláusulas legales' },
    { key: 'leads.manage', label: 'Gestionar CRM de Leads', desc: 'Permite administrar prospectos y cambiar su estado' },
    { key: 'whatsapp.access', label: 'Acceso a WhatsApp Business', desc: 'Permite ver chats y responder mensajes por WhatsApp' },
    { key: 'precotizador.botConfig', label: 'Configurar Chatbot IA Precotizador', desc: 'Permite editar mensajes iniciales y prompt del Bot' },
    { key: 'agenda.manage', label: 'Agendamiento y Citas en Agenda', desc: 'Permite ver y gestionar citas agendadas' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Matriz de Permisos para {user.name}</h2>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Asignacion de Rol y Empresa */}
          <div className="grid sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Rol de Usuario</label>
              <select
                value={role}
                onChange={e => setRole(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
              >
                <option value="usuario">💼 Usuario / Ventas</option>
                <option value="admin">🛡️ Admin de Empresa</option>
                <option value="superadmin">⚡ Superadmin (Acceso Total)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Empresa Asignada</label>
              <select
                value={assignedCompanyId}
                onChange={e => setAssignedCompanyId(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white focus:ring-2 focus:ring-indigo-300 outline-none"
              >
                <option value="">🌐 Acceso a Todas las Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Permisos Granulares */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Permisos Granulares Específicos
            </h3>

            {role === 'superadmin' ? (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                ⚡ <strong>Usuario Superadmin:</strong> Tiene acceso total e irrestricto a todas las funcionalidades sin limitaciones.
              </div>
            ) : (
              <div className="space-y-2">
                {permsList.map(p => {
                  const isChecked = userPerms[p.key] !== false;
                  return (
                    <label
                      key={p.key}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked ? 'bg-indigo-50/50 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-60'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-800">{p.label}</p>
                        <p className="text-[11px] text-slate-500">{p.desc}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTogglePerm(p.key)}
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={loading} className="px-4 py-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm">
            {loading ? 'Guardando...' : 'Guardar Permisos'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'companies'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<CompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [permUser, setPermUser] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role === 'superadmin';

  const loadData = () => {
    setLoading(true);
    Promise.all([
      fetchWithAuth(`${API_URL}/users`).then(r => r.json()),
      fetchWithAuth(`${API_URL}/companies`).then(r => r.json()),
    ])
      .then(([uData, cData]) => {
        setUsers(Array.isArray(uData) ? uData : []);
        setCompanies(Array.isArray(cData) ? cData : []);
        setLoading(false);
      })
      .catch(() => {
        setUsers([]);
        setCompanies([]);
        setLoading(false);
      });
  };

  useEffect(() => { loadData(); }, []);

  const toggleCompanyModule = async (companyId: string, currentPerms: Record<string, boolean>, modKey: string) => {
    const updated = {
      ...DEFAULT_COMPANY_MODULES,
      ...(currentPerms || {}),
      [modKey]: !((currentPerms || {})[modKey] !== false),
    };

    try {
      await fetchWithAuth(`${API_URL}/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: updated }),
      });
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleActive = async (u: User) => {
    setTogglingId(u.id);
    try {
      await fetchWithAuth(`${API_URL}/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      loadData();
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Panel de Gestión & Permisos Granulares</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Asigna empresas, permisos por persona y módulos contratados por empresa</p>
        </div>

        {activeTab === 'users' && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-sm self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Nuevo usuario
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 bg-slate-200/60 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
            activeTab === 'users' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          👥 Permisos por Usuario ({users.length})
        </button>
        {isSuperAdmin && (
          <button
            onClick={() => setActiveTab('companies')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'companies' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🏢 Módulos Habilitados por Empresa ({companies.length})
          </button>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white border border-slate-200 rounded-2xl">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full" />
        </div>
      ) : activeTab === 'users' ? (
        /* TAB 1: USERS & PERMISSIONS */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Nombre / Usuario</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa Asignada</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Permisos & Acciones</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map(user => {
                const assignedCompany = (user as any).company?.name || 'Todas las Empresas';
                const initial = (user.name || user.email || 'U').charAt(0).toUpperCase();
                return (
                  <tr key={user.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                          {initial}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{user.name || 'Sin nombre'}</p>
                          <p className="text-xs text-slate-400">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg">
                        {assignedCompany}
                      </span>
                    </td>
                    <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                    <td className="px-5 py-4"><StatusBadge isActive={user.isActive} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {isSuperAdmin && (
                          <button
                            onClick={() => setPermUser(user)}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg border border-indigo-200 transition-colors"
                          >
                            <Sliders className="w-3.5 h-3.5" /> Matriz Permisos
                          </button>
                        )}

                        <button
                          onClick={() => setEditUser(user)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-slate-200"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleActive(user)}
                          disabled={togglingId === user.id}
                          className={`p-1.5 rounded-lg transition-colors border border-slate-200 ${
                            user.isActive
                              ? 'text-slate-400 hover:text-red-500 hover:bg-red-50'
                              : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
                          } disabled:opacity-30`}
                          title={user.isActive ? 'Desactivar' : 'Activar'}
                        >
                          {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* TAB 2: COMPANY MODULES */
        <div className="space-y-4">
          {companies.map(c => {
            const perms = (c.permissions as Record<string, boolean>) || DEFAULT_COMPANY_MODULES;

            const modules = [
              { key: 'quotes', label: '📄 Cotizaciones Formales', desc: 'Módulo de generación de PDF y envío' },
              { key: 'contracts', label: '📝 Contratos Digitales', desc: 'Conversión de propuestas a contratos' },
              { key: 'precotizador', label: '🤖 Precotizador Web / IA', desc: 'Precotización pública y bot comercial' },
              { key: 'whatsapp', label: '💬 WhatsApp Business', desc: 'Integración y gestión de chats' },
              { key: 'leads', label: '👥 CRM de Leads', desc: 'Gestión de prospectos recibidos' },
              { key: 'agenda', label: '📅 Agenda de Citas', desc: 'Agendamiento de reuniones' },
              { key: 'analytics', label: '📊 Dashboard & Métricas', desc: 'Reportes comerciales y rendimiento' },
            ];

            return (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                  {c.logoUrl ? (
                    <img src={`${API_URL}/public${c.logoUrl}`} alt={c.name} className="h-8 object-contain" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center">
                      {(c.name || 'C').charAt(0)}
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-slate-800 text-base">{c.name}</h3>
                    <p className="text-xs text-slate-400">Configuración de módulos contratados por empresa</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {modules.map(m => {
                    const isEnabled = perms[m.key] !== false;
                    return (
                      <div
                        key={m.key}
                        onClick={() => toggleCompanyModule(c.id, perms, m.key)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isEnabled
                            ? 'bg-emerald-50/50 border-emerald-200 text-slate-800 hover:border-emerald-300'
                            : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{m.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                            isEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isEnabled ? 'Habilitado' : 'Desactivado'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{m.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {showCreate && <CreateModal onClose={() => setShowCreate(false)} onCreated={loadData} />}
      {editUser && <EditModal user={editUser} onClose={() => setEditUser(null)} onUpdated={loadData} />}
      {permUser && (
        <EditUserPermissionsModal
          user={permUser}
          companies={companies}
          onClose={() => setPermUser(null)}
          onUpdated={loadData}
        />
      )}
    </div>
  );
}
