export default function TentangDosis() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-12 animate-fade-in-up">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4">
          Panduan Perhitungan Dosis
        </h1>
        <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
          Sistem PharmaSafe menggunakan standar farmakologi dan rumus medis yang divalidasi untuk memastikan dosis yang diberikan aman dan sesuai dengan kondisi pasien.
        </p>
      </div>

      <div className="space-y-8">
        {/* mg/kgBB Section */}
        <section className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
            Metode Berbasis Berat Badan (mg/kgBB)
          </h2>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Metode ini mengutamakan ketepatan dosis berdasarkan massa tubuh pasien. Digunakan sebagai prioritas utama terutama untuk pasien pediatri (anak & bayi) serta dosis spesifik dewasa.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code className="text-emerald-700 font-mono font-semibold block mb-2">
              Dosis = Berat Badan (kg) × Dosis per kg (mg)
            </code>
            <ul className="text-xs text-slate-500 list-disc list-inside space-y-1">
              <li><strong>Bayi & Anak:</strong> Digunakan sebagai metode utama (sangat akurat).</li>
              <li><strong>Remaja:</strong> Dosis dibatasi (capped) agar tidak melebihi referensi dosis standar dewasa (70kg).</li>
              <li><strong>Dewasa:</strong> Digunakan sesuai dosis penuh.</li>
              <li><strong>Lansia:</strong> Dosis akhir dikurangi 20% (dikalikan 0.8) untuk kompensasi penurunan fungsi organ.</li>
            </ul>
          </div>
        </section>

        {/* Rumus Fried */}
        <section className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
            Rumus Fried (Untuk Bayi &lt; 2 Tahun)
          </h2>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Rumus Fried digunakan jika obat hanya memiliki standar dosis tetap (dosis dewasa), dan tidak memiliki data spesifik per kg berat badan.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code className="text-emerald-700 font-mono font-semibold block mb-2">
              Dosis Anak = (Umur dalam Bulan / 150) × Dosis Dewasa
            </code>
            <p className="text-xs text-slate-500">
              *Catatan: Umur minimal dihitung 1 bulan untuk menghindari pembagian dengan nol.
            </p>
          </div>
        </section>

        {/* Rumus Young */}
        <section className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
            Rumus Young (Untuk Anak 2 - 12 Tahun)
          </h2>
          <p className="text-slate-600 text-sm mb-4 leading-relaxed">
            Rumus Young merupakan standar perhitungan dosis anak berdasarkan usia ketika berat badan tidak diketahui secara akurat atau obat hanya memiliki takaran dosis dewasa tetap.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
            <code className="text-amber-700 font-mono font-semibold block mb-2">
              Dosis Anak = (Umur / (Umur + 12)) × Dosis Dewasa
            </code>
          </div>
        </section>

        {/* Penyesuaian Geriatri & Psikotropika */}
        <section className="glass-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-4 border-b border-slate-200 pb-2">
            Penyesuaian Khusus Lansia & Psikotropika
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-700 text-sm mb-2">Geriatri (Lansia ≥ 60 Tahun)</h3>
              <p className="text-xs text-slate-600">
                Fungsi hati dan ginjal umumnya menurun pada usia lanjut. Oleh karena itu, dosis standar selalu <strong>dikurangi 20% (Dosis × 0.8)</strong> untuk menghindari toksisitas.
              </p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-700 text-sm mb-2">Obat Psikotropika</h3>
              <p className="text-xs text-slate-600">
                Psikotropika sangat ketat diawasi. Dilarang keras untuk Bayi dan Anak/Remaja di bawah 18 tahun (FATAL). Untuk lansia, dosis diturunkan lebih agresif menjadi <strong>setengahnya (Dosis × 0.5)</strong> karena risiko sedasi berlebihan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
