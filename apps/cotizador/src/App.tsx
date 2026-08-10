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
import { ProtectedRoute } from './components/ProtectedRoute';
import { GlobalDisconnectBanner } from './components/whatsapp/GlobalDisconnectBanner';
import { WhatsappProvider } from './whatsapp-context';
import { getUser, logout } from './auth';
import { FileText, Home, Users, LogOut, BarChart2, UserCog, Calendar, MessageCircle, Bot, LayoutTemplate } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = getUser();
  const isAdmin = user?.role === 'admin';

  const navLinkCls = (path: string) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      location.pathname === path
        ? 'bg-indigo-50 text-indigo-700'
        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-20 gap-2">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity flex-shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">V</div>
          <span className="font-bold text-slate-800 hidden sm:block">Vertex Cotizador</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5 overflow-x-auto">
          <Link to="/" className={navLinkCls('/')}>
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Inicio</span>
          </Link>
          <Link to="/dashboard" className={navLinkCls('/dashboard')}>
            <BarChart2 className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>
          <Link to="/lista" className={navLinkCls('/lista')}>
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Cotizaciones</span>
          </Link>
          {isAdmin && (
            <Link to="/plantillas" className={navLinkCls('/plantillas')}>
              <LayoutTemplate className="w-4 h-4" />
              <span className="hidden sm:inline">Plantillas</span>
            </Link>
          )}
          <Link to="/leads" className={navLinkCls('/leads')}>
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Leads</span>
          </Link>
          <Link to="/agenda" className={navLinkCls('/agenda')}>
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Agenda</span>
          </Link>
          <Link to="/precotizador-chats" className={navLinkCls('/precotizador-chats')}>
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">Chat AI</span>
          </Link>
          <Link to="/whatsapp" className={navLinkCls('/whatsapp')}>
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">WhatsApp</span>
          </Link>
          {isAdmin && (
            <Link to="/usuarios" className={navLinkCls('/usuarios')}>
              <UserCog className="w-4 h-4" />
              <span className="hidden sm:inline">Usuarios</span>
            </Link>
          )}
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700 max-w-[100px] truncate">{user.name}</span>
              {isAdmin && (
                <span className="text-xs bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-semibold">Admin</span>
              )}
            </div>
          )}
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <GlobalDisconnectBanner />

      <main className="flex-1 p-4 sm:p-6">
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
