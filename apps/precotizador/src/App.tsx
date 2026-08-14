import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { PrecotizadorPage } from './pages/PrecotizadorPage';
import { CompanySelectorPage } from './pages/CompanySelectorPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CompanySelectorPage />} />
        <Route path="/catalog/:companySlug" element={<PrecotizadorPage />} />
        <Route path="/:companySlug" element={<PrecotizadorPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
