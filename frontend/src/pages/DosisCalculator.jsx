import { useState } from "react";
import LoadingButton from "../components/LoadingButton";
import { hitungDosis } from "../api/apiClient";

const OBAT_OPTIONS = [
  { nama: "Paracetamol", jenis: "bebas" },
  { nama: "Amoxicillin", jenis: "keras" },
  { nama: "Ibuprofen", jenis: "bebas" },
  { nama: "Codein", jenis: "psikotropika" },
  { nama: "Metformin", jenis: "keras" },
  { nama: "Omeprazole", jenis: "keras" },
  { nama: "Diazepam", jenis: "psikotropika" },
  { nama: "Cetirizine", jenis: "bebas" },
  { nama: "Captopril", jenis: "keras" },
  { nama: "Vitamin C", jenis: "bebas" },
  { nama: "Dexamethasone", jenis: "keras" },
  { nama: "Antasida DOEN", jenis: "bebas" },
];

const ALERGI_OPTIONS = [
  "alergi_paracetamol",
  "gangguan_hati_berat",
  "alergi_penisilin",
  "alergi_amoxicillin",
  "alergi_nsaid",
  "tukak_lambung",
  "gangguan_ginjal",
  "alergi_opioid",
  "depresi_pernapasan",
  "asma_akut",
  "asidosis_laktat",
  "alergi_ppi",
  "alergi_benzodiazepine",
  "miastenia_gravis",
  "sleep_apnea",
  "alergi_cetirizine",
  "gangguan_ginjal_berat",
  "alergi_ace_inhibitor",
  "angioedema",
  "kehamilan",
  "gagal_ginjal",
  "infeksi_jamur_sistemik",
  "alergi_kortikosteroid",
];

export default function DosisCalculator({ addToast }) {
  const [form, setForm] = useState({
    namaObat: "",
    umur: "",
    beratBadan: "",
    jenisObat: "",
    rpiAlergi: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "namaObat") {
      const selected = OBAT_OPTIONS.find((o) => o.nama === value);
      if (selected) {
        setForm((prev) => ({ ...prev, namaObat: value, jenisObat: selected.jenis }));
      }
    }
  };

  const handleAlergiToggle = (alergi) => {
    setForm((prev) => ({
      ...prev,
      rpiAlergi: prev.rpiAlergi.includes(alergi)
        ? prev.rpiAlergi.filter((a) => a !== alergi)
        : [...prev.rpiAlergi, alergi],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    try {
      const payload = {
        namaObat: form.namaObat,
        umur: Number(form.umur),
        beratBadan: Number(form.beratBadan),
        jenisObat: form.jenisObat,
        rpiAlergi: form.rpiAlergi,
      };

      const response = await hitungDosis(payload);

      if (response.success) {
        setResult(response.data);

        if (response.data.keamanan.status === "WARNING" || response.data.keamanan.status === "CAUTION") {
          const warningMsgs = (response.data.keamanan.peringatan || [])
            .filter(p => p && p.trim().startsWith("⚠️"))
            .map(p => p.replace("⚠️", "").trim())
            .join("\n\n");

          const title = response.data.keamanan.status === "WARNING" ? "Peringatan Dosis!" : "Perhatian";

          if (warningMsgs) {
            addToast("warning", warningMsgs, title);
          } else {
            addToast("success", `Dosis ${form.namaObat} berhasil dihitung. Status: ${response.data.keamanan.status}.`);
          }
        } else {
          addToast("success", `Dosis ${form.namaObat} berhasil dihitung. Status: AMAN.`);
        }
      }
    } catch (err) {
      const errorData = err.response?.data?.error;
      if (errorData) {
        const severity = errorData.severity === "CRITICAL" ? "RISIKO FATAL" : "Error Validasi";
        addToast("error", errorData.message, severity);
      } else {
        addToast("error", "Gagal terhubung ke server. Pastikan backend berjalan.", "Koneksi Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const jenisColor = {
    bebas: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    keras: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    psikotropika: "bg-red-500/20 text-red-400 border-red-500/30",
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid lg:grid-cols-5 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-3 glass-card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-xl font-extrabold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-sm">
              1
            </span>
            Data Pasien & Obat
          </h2>

          <div className="grid sm:grid-cols-2 gap-5">
            {/* Nama Obat */}
            <div>
              <label htmlFor="namaObat" className="input-label">Nama Obat</label>
              <select
                id="namaObat"
                name="namaObat"
                value={form.namaObat}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="">— Pilih Obat —</option>
                {OBAT_OPTIONS.map((o) => (
                  <option key={o.nama} value={o.nama}>
                    {o.nama} ({o.jenis})
                  </option>
                ))}
              </select>
            </div>

            {/* Jenis Obat */}
            <div>
              <label htmlFor="jenisObat" className="input-label">Jenis Obat</label>
              <div className="relative">
                <input
                  id="jenisObat"
                  name="jenisObat"
                  value={form.jenisObat}
                  readOnly
                  className="input-field bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200"
                  placeholder="Otomatis terisi"
                />
                {form.jenisObat && (
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs px-2 py-0.5 rounded-full border ${jenisColor[form.jenisObat] || ""}`}>
                    {form.jenisObat}
                  </span>
                )}
              </div>
            </div>

            {/* Umur */}
            <div>
              <label htmlFor="umur" className="input-label">Umur (Tahun)</label>
              <input
                id="umur"
                name="umur"
                type="number"
                value={form.umur}
                onChange={handleChange}
                className="input-field"
                placeholder="0 - 120"
                min="0"
                max="120"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Rentang valid: 0 — 120 tahun</p>
            </div>

            {/* Berat Badan */}
            <div>
              <label htmlFor="beratBadan" className="input-label">Berat Badan (kg)</label>
              <input
                id="beratBadan"
                name="beratBadan"
                type="number"
                step="0.1"
                value={form.beratBadan}
                onChange={handleChange}
                className="input-field"
                placeholder="Contoh: 70"
                min="0.1"
                max="300"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Rentang valid: 0.1 — 300 kg</p>
            </div>
          </div>

          {/* Riwayat Alergi */}
          <div className="mt-6">
            <label className="input-label">Riwayat Alergi / Kontraindikasi</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-200">
              {ALERGI_OPTIONS.map((alergi) => (
                <label
                  key={alergi}
                  className={`flex items-center gap-2 text-xs p-2 rounded-lg cursor-pointer transition-all duration-150 ${
                    form.rpiAlergi.includes(alergi)
                      ? "bg-red-50 text-red-600 border border-red-200 shadow-sm font-medium"
                      : "hover:bg-white text-slate-600 border border-transparent hover:border-slate-200 hover:shadow-sm"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={form.rpiAlergi.includes(alergi)}
                    onChange={() => handleAlergiToggle(alergi)}
                    className="accent-red-500 rounded"
                  />
                  <span className="truncate">{alergi.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
            {form.rpiAlergi.length > 0 && (
              <p className="text-xs text-red-400 mt-2">
                ⚠ {form.rpiAlergi.length} alergi dipilih
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8">
            <LoadingButton
              type="submit"
              isLoading={isLoading}
              loadingText="Menghitung Dosis..."
              className="w-full text-base py-4"
            >
              Hitung Dosis Obat
            </LoadingButton>
          </div>
        </form>

        {/* Result Panel */}
        <div className="lg:col-span-2 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          {result ? (
            <div className="glass-card p-6 md:p-8 space-y-6">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold shadow-sm">
                  2
                </span>
                Hasil Kalkulasi
              </h2>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  result.keamanan.status === "AMAN"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : result.keamanan.status === "WARNING"
                    ? "bg-red-500/15 text-red-400 border-red-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}>
                  {result.keamanan.status}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full border ${jenisColor[result.obat.jenis] || ""}`}>
                  {result.obat.jenis}
                </span>
              </div>

              {/* Info Obat */}
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-800">{result.obat.nama}</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="text-slate-500 font-medium">Kategori Umur</div>
                  <div className="text-slate-700 font-bold capitalize">{result.pasien.kategoriUmur}</div>
                  <div className="text-slate-500 font-medium">Faktor Umur</div>
                  <div className="text-slate-700 font-bold">×{result.pasien.faktorUmur}</div>
                  <div className="text-slate-500 font-medium">Metode</div>
                  <div className="text-slate-700 font-bold capitalize">{result.kalkulasi.metode.replace(/_/g, " ")}</div>
                </div>
              </div>

              {/* Dosis */}
              <div className="p-6 rounded-xl bg-emerald-50 border border-emerald-100 shadow-sm">
                <div className="text-center">
                  <p className="text-xs text-emerald-700 font-bold uppercase tracking-wider mb-2">Dosis Per Pemberian</p>
                  <p className="text-4xl font-extrabold text-emerald-600 drop-shadow-sm">
                    {result.kalkulasi.dosisPerPemberian} <span className="text-xl text-emerald-500">{result.kalkulasi.satuan}</span>
                  </p>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-xl bg-white border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600/70">Frekuensi</p>
                    <p className="text-sm font-extrabold text-emerald-700 mt-1">{result.kalkulasi.frekuensiHarian}× / hari</p>
                  </div>
                  <div className="text-center p-3 rounded-xl bg-white border border-emerald-100 shadow-sm">
                    <p className="text-[10px] uppercase font-bold text-emerald-600/70">Dosis Harian</p>
                    <p className="text-sm font-extrabold text-emerald-700 mt-1">{result.kalkulasi.dosisHarian} mg</p>
                  </div>
                </div>
                {result.kalkulasi.dosisDiCapKeMaksimum && (
                  <p className="text-xs text-amber-400 mt-3 text-center font-medium">
                    ⚠ Dosis telah di-cap ke batas maksimum ({result.obat.maksDosisHarian} mg/hari)
                  </p>
                )}
              </div>

              {/* Peringatan & Informasi */}
              {result.keamanan.peringatan.length > 0 && (
                <div className="space-y-2 mt-4">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Catatan Kalkulasi</h3>
                  {result.keamanan.peringatan.map((p, i) => {
                    const isInfo = p.trim().startsWith("ℹ️");
                    return (
                      <div key={i} className={`p-3 rounded-xl border text-xs leading-relaxed shadow-sm ${
                        isInfo 
                          ? "bg-blue-50/50 border-blue-200 text-blue-700" 
                          : "bg-amber-50/80 border-amber-200 text-amber-700 font-medium"
                      }`}>
                        {p}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center min-h-[400px]">
              <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-100 shadow-sm">
                <span className="font-extrabold text-2xl text-slate-300 tracking-tighter">Rx</span>
              </div>
              <h3 className="text-slate-800 font-extrabold text-lg mb-2">Belum Ada Kalkulasi</h3>
              <p className="text-sm text-slate-500 max-w-[250px] leading-relaxed">
                Isi form di samping dan klik <br/><span className="font-semibold text-emerald-600">Hitung Dosis Obat</span> untuk melihat hasil.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
