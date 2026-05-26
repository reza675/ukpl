import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Toast, { useToast } from "./components/Toast";
import Dashboard from "./pages/Dashboard";
import DosisCalculator from "./pages/DosisCalculator";
import TentangDosis from "./pages/TentangDosis";

/**
 * App - Komponen utama PharmaSafe
 *
 * Router dengan halaman:
 * - / → Dashboard & Kalkulator Dosis
 * - /tentang-dosis → Tentang Dosis
 */
export default function App() {
  const { toasts, addToast, removeToast } = useToast();

  return (
    <BrowserRouter>
      {/* Toast Notifications (Global) */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Navbar */}
      <Navbar />

      {/* Page Content */}
      <main className="min-h-[calc(100vh-64px)]">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kalkulator" element={<DosisCalculator addToast={addToast} />} />
          <Route path="/tentang-dosis" element={<TentangDosis />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center">
        <p className="text-xs text-slate-600">
          PharmaSafe — Sistem Manajemen Apotek & Kalkulator Dosis Medis
        </p>
      </footer>
    </BrowserRouter>
  );
}
