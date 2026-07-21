import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SelectorPage } from './pages/SelectorPage';
import { NuevaCotizacionPage } from './pages/NuevaCotizacionPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-sm">V</div>
          <span className="font-bold text-slate-800">Vertex Cotizador</span>
        </header>
        
        <main className="flex-1 p-6">
          <Routes>
            <Route path="/" element={<SelectorPage />} />
            <Route path="/cotizaciones/nueva" element={<NuevaCotizacionPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
