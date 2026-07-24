import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SelectorPage } from './pages/SelectorPage';
import { QuoteBuilderPage } from './pages/QuoteBuilderPage';
import { QuoteListPage } from './pages/QuoteListPage';
import { LeadsPage } from './pages/LeadsPage';
import { LoginPage } from './pages/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getUser, logout } from './auth';
import { FileText, Home, Users, LogOut } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const user = getUser();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-20">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">V</div>
          <span className="font-bold text-slate-800">Vertex Cotizador</span>
        </Link>

        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            Inicio
          </Link>
          <Link
            to="/lista"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/lista' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Cotizaciones
          </Link>
          <Link
            to="/leads"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/leads' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            Leads
          </Link>
        </nav>

        {/* User info + logout */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-slate-700">{user.name}</span>
              {user.role === 'admin' && (
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

      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protegidas */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout><SelectorPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/nueva/:companySlug"
          element={
            <ProtectedRoute>
              <AppLayout><QuoteBuilderPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lista"
          element={
            <ProtectedRoute>
              <AppLayout><QuoteListPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/leads"
          element={
            <ProtectedRoute>
              <AppLayout><LeadsPage /></AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
