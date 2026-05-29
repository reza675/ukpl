import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24 animate-fade-in-up">
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold tracking-wider uppercase border border-emerald-100 shadow-sm">
            <span>MEDICAL DOSAGE SYSTEM</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-800 leading-[1.15]">
            Hitung Dosis Obat <br />
            <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Dengan Presisi
            </span>
            <br /> Dan Aman
          </h1>
          
          <p className="text-slate-500 text-lg md:text-xl max-w-lg leading-relaxed">
            Platform modern untuk apoteker dan tenaga medis. Kalkulasi dosis berdasarkan standar farmakologi, pertimbangan usia, dan riwayat alergi secara real-time.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button 
              onClick={() => navigate('/kalkulator')}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Mulai Kalkulator
            </button>
            <button 
              onClick={() => navigate('/tentang-dosis')}
              className="px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              Pelajari Formula
            </button>
          </div>
        </div>

        <div className="relative stagger-children">
          {/* Main Card */}
          <div className="glass-card bg-white p-8 md:p-10 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex gap-2 mb-8">
              <div className="w-3 h-3 rounded-full bg-red-400"></div>
              <div className="w-3 h-3 rounded-full bg-amber-400"></div>
              <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
            </div>

            <div className="text-center mb-10">
              <h2 className="text-3xl font-extrabold text-slate-800">
                Pharma<span className="text-emerald-600">Safe</span>
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Smart Pharmacy Calculator</p>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-2xl font-extrabold text-slate-800">12</h3>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Obat Aktif</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-2xl font-extrabold text-slate-800">99%</h3>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Akurasi</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-slate-50 border border-slate-100">
                <h3 className="text-2xl font-extrabold text-slate-800">24/7</h3>
                <p className="text-[10px] uppercase tracking-wider text-slate-500 mt-1 font-semibold">Akses</p>
              </div>
            </div>
          </div>
          
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-3xl z-0"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-teal-400/20 rounded-full blur-3xl z-0"></div>
        </div>
      </div>
    </div>
  );
}
