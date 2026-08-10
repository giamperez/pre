import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SelectorPage } from './pages/SelectorPage';
import { QuoteBuilderPage } from './pages/QuoteBuilderPage';
import { QuoteListPage } from './pages/QuoteListPage';
import { LeadsPage } from './pages/LeadsPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/UsersPage';
import { AgendaPage } from './pages/AgendaPage';
import { WhatsappPage } from './pages/WhatsappPage';
import { PrecotizadorChatPage } from './pages/PrecotizadorChatPage';
import { CompanyPanelPage } from './pages/CompanyPanelPage';
import { TemplateEditorPage } from './pages/TemplateEditorPage';
import { ContractsListPage } from './pages/ContractsListPage';
import { ContractEditorPage } from './pages/ContractEditorPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalDisconnectBanner } from './components/whatsapp/GlobalDisconnectBanner';
import { WhatsappProvider } from './whatsapp-context';
import { getUser, logout } from './auth';
import { FileText, Home, Users, LogOut, BarChart2, UserCog, Calendar, MessageCircle, Bot, ScrollText, Menu, X } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = getUser();
  const isAdmin = user?.role === 'admin';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkCls = (path: string) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
      location.pathname === path
        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkCls = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
      location.pathname === path
        ? 'bg-indigo-600 text-white shadow-md'
        : 'text-slate-700 hover:bg-slate-100'
    }`;

  const navItems = [
    { path: '/', label: 'Inicio', icon: <Home className="w-4 h-4" /> },
    { path: '/dashboard', label: 'Dashboard', icon: <BarChart2 className="w-4 h-4" /> },
    { path: '/lista', label: 'Cotizaciones', icon: <FileText className="w-4 h-4" /> },
    { path: '/contratos', label: 'Contratos', icon: <ScrollText className="w-4 h-4" /> },
    { path: '/leads', label: 'Leads', icon: <Users className="w-4 h-4" /> },
    { path: '/agenda', label: 'Agenda', icon: <Calendar className="w-4 h-4" /> },
    { path: '/precotizador-chats', label: 'Chat AI', icon: <Bot className="w-4 h-4" /> },
    { path: '/whatsapp', label: 'WhatsApp', icon: <MessageCircle className="w-4 h-4" /> },
    ...(isAdmin ? [{ path: '/usuarios', label: 'Usuarios', icon: <UserCog className="w-4 h-4" /> }] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-xs">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm shadow-indigo-200">
            V
          </div>
          <span className="font-bold text-slate-800 text-base">Vertex</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={navLinkCls(item.path)}>
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User info + Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2 pr-2 border-r border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-800 leading-none truncate max-w-[120px]">{user.name}</span>
                <span className="text-[10px] text-slate-400 font-medium capitalize">{user.role}</span>
              </div>
            </div>
          )}

          <button
            onClick={logout}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-xs top-[57px]" onClick={() => setMobileMenuOpen(false)}>
          <div
            className="bg-white border-b border-slate-200 p-4 space-y-2 shadow-2xl animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            {user && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{user.name}</p>
                  <p className="text-xs text-slate-500">{user.email || user.role}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={mobileNavLinkCls(item.path)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <button
              onClick={() => { setMobileMenuOpen(false); logout(); }}
              className="w-full mt-3 flex items-center justify-center gap-2 p-3 bg-red-50 text-red-700 hover:bg-red-100 rounded-xl text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}

      <GlobalDisconnectBanner />

      <main className="flex-1 p-3 sm:p-6 max-w-full overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <WhatsappProvider>
      <Router>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas */}
          <Route path="/" element={<ProtectedRoute><AppLayout><SelectorPage /></AppLayout></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
          <Route path="/nueva/:companySlug" element={<ProtectedRoute><AppLayout><QuoteBuilderPage /></AppLayout></ProtectedRoute>} />
          <Route path="/editar/:quoteId" element={<ProtectedRoute><AppLayout><QuoteBuilderPage /></AppLayout></ProtectedRoute>} />
          <Route path="/lista" element={<ProtectedRoute><AppLayout><QuoteListPage /></AppLayout></ProtectedRoute>} />
          <Route path="/contratos" element={<ProtectedRoute><AppLayout><ContractsListPage /></AppLayout></ProtectedRoute>} />
          <Route path="/contratos/editar/:contractId" element={<ProtectedRoute><AppLayout><ContractEditorPage /></AppLayout></ProtectedRoute>} />
          <Route path="/empresa/:companySlug" element={<ProtectedRoute><AppLayout><CompanyPanelPage /></AppLayout></ProtectedRoute>} />
          <Route path="/plantillas/nueva" element={<ProtectedRoute><AppLayout><TemplateEditorPage /></AppLayout></ProtectedRoute>} />
          <Route path="/plantillas/editar/:templateId" element={<ProtectedRoute><AppLayout><TemplateEditorPage /></AppLayout></ProtectedRoute>} />
          <Route path="/leads" element={<ProtectedRoute><AppLayout><LeadsPage /></AppLayout></ProtectedRoute>} />
          <Route path="/agenda" element={<ProtectedRoute><AppLayout><AgendaPage /></AppLayout></ProtectedRoute>} />
          <Route path="/precotizador-chats" element={<ProtectedRoute><AppLayout><PrecotizadorChatPage /></AppLayout></ProtectedRoute>} />
          <Route path="/whatsapp" element={<ProtectedRoute><AppLayout><WhatsappPage /></AppLayout></ProtectedRoute>} />
          <Route path="/usuarios" element={<ProtectedRoute><AppLayout><UsersPage /></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </WhatsappProvider>
  );
}

export default App;
