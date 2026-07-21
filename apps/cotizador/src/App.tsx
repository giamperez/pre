import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { SelectorPage } from './pages/SelectorPage';
import { QuoteBuilderPage } from './pages/QuoteBuilderPage';
import { QuoteListPage } from './pages/QuoteListPage';
import { FileText, Home } from 'lucide-react';

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

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
        </nav>
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
        <Route path="/" element={<AppLayout><SelectorPage /></AppLayout>} />
        <Route path="/nueva/:companySlug" element={<AppLayout><QuoteBuilderPage /></AppLayout>} />
        <Route path="/lista" element={<AppLayout><QuoteListPage /></AppLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
