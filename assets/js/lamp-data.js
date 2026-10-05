/*
 * DATA LAMPU RAKITAN — bentuk, warna, harga, paket, dan foto per bagian.
 * Semua harga dalam Rupiah dan masih ANGKA CONTOH; ganti lewat Mode Edit (#edit)
 * tab "Lampu" atau langsung di file ini.
 *
 * HARGA CORET: website menampilkan "harga satuan" (jumlah harga kap + badan + alas
 * bila dibeli terpisah) sebagai pembanding harga paket. Angka itu HARUS harga
 * satuan yang benar-benar berlaku di katalog bagian satuan, bukan harga fiktif,
 * agar tidak melanggar UU Perlindungan Konsumen (Pasal 9–10). Diskon paket
 * (packages.disc) harus masih menyisakan margin setelah biaya cetak + kirim.
 *
 * photos: foto asli per bagian. Kunci "jenis:bentuk:warna" (mis. "body:bola:salmon")
 * atau "jenis:bentuk" untuk semua warna. Nilai: path file (assets/img/…) atau data URI.
 * Tanpa foto, ilustrasi SVG dipakai.
 */
window.MKS_LAMP = {
  ledPrice: 25000,
  // Kit kelistrikan jadi (fitting E27, kabel 1,5 m, saklar, steker) dari produsen
  // yang komponennya bertanda SNI/K3L. Dijual sebagai baris terpisah agar lampu
  // bisa dibeli "hanya bagian cetak". Jangan menulis lampu rakitan "ber-SNI".
  wiringPrice: 49000,
  wiringLabel: "Kit kelistrikan ber-SNI/K3L (fitting E27, kabel 1,5 m, saklar, steker)",
  // Waktu produksi: preset/bagian berstok vs kombinasi custom
  leadTime: { preset: "3–5 hari kerja", custom: "7–10 hari kerja" },
  // Indeks preset yang dibuka pertama kali dan diberi label "Paling populer"
  popularPreset: 1,
  maxBodies: 3,
  // Palet inti: 5 warna badan/alas yang saling cocok dalam kombinasi apa pun,
  // supaya stok filamen (1 roll/warna) dan ganti warna di printer tetap sedikit.
  // Pakai satu merek & satu lini PLA (disarankan matte) untuk semua warna; catat
  // kode produk filamen di `sku` agar pembelian ulang warnanya persis sama.
  // Warna cadangan (bisa diaktifkan lagi sebagai edisi terbatas lewat Mode Edit):
  //   { id: "lavender", name: "Lavender", hex: "#b79ad6" }
  //   { id: "jingga", name: "Jingga", hex: "#ea7f31" }
  //   { id: "kunyit", name: "Kunyit", hex: "#e2b43c" }
  //   { id: "merahmuda", name: "Merah muda", hex: "#e6a3bd" }
  colors: [
    { id: "krem", name: "Krem", hex: "#efe3cb", sku: "" },
    { id: "hitam", name: "Hitam arang", hex: "#2b2622", sku: "" },
    { id: "bata", name: "Merah bata", hex: "#c4522f", sku: "" },
    { id: "zaitun", name: "Zaitun", hex: "#5c8040", sku: "" },
    { id: "salmon", name: "Salmon", hex: "#e8836f", sku: "" },
  ],
  // Kap: PLA natural/putih tembus cahaya. Satu material cukup; "Gading" adalah
  // PLA natural tanpa pigmen (paling rata meneruskan cahaya), "Putih" PLA putih.
  shadeColors: [
    { id: "gading", name: "Gading", hex: "#f3e8d1", sku: "" },
    { id: "putih", name: "Putih", hex: "#f8f5ee", sku: "" },
  ],
  heads: [
    { id: "plisir", name: "Silinder plisir", price: 219000, cm: 14 },
    { id: "kerucut", name: "Kerucut", price: 219000, cm: 13 },
    { id: "kotak", name: "Kotak", price: 229000, cm: 13 },
  ],
  bodies: [
    { id: "bola", name: "Bola", price: 85000, cm: 8, kg: 0.18 },
    { id: "kubus", name: "Kubus", price: 85000, cm: 7, kg: 0.17 },
    { id: "cincin", name: "Cincin", price: 65000, cm: 4.5, kg: 0.12 },
    { id: "heksa", name: "Heksagon", price: 89000, cm: 7.5, kg: 0.19 },
    { id: "silinder", name: "Silinder", price: 75000, cm: 6, kg: 0.15 },
  ],
  bases: [
    { id: "bulat", name: "Bulat", price: 99000 },
    { id: "segitiga", name: "Segitiga", price: 99000 },
    { id: "kotak", name: "Kotak", price: 99000 },
    { id: "bunga", name: "Bunga", price: 115000 },
  ],
  packages: {
    3: { name: "Trio", disc: 0.15, cm: "24–30", note: "Pas untuk meja samping tempat tidur" },
    4: { name: "Kuarto", disc: 0.22, cm: "30–38", note: "Paling sering dipesan, untuk meja kerja" },
    5: { name: "Kuinto", disc: 0.28, cm: "36–46", note: "Paling tinggi, untuk sudut ruang tamu" },
  },
  presets: [
    { name: "Senja", head: { shape: "kerucut", color: "gading" }, body: [{ shape: "kubus", color: "bata" }, { shape: "heksa", color: "krem" }, { shape: "bola", color: "salmon" }], base: { shape: "kotak", color: "bata" } },
    { name: "Kebun", head: { shape: "plisir", color: "gading" }, body: [{ shape: "bola", color: "zaitun" }, { shape: "cincin", color: "krem" }, { shape: "kubus", color: "salmon" }], base: { shape: "bulat", color: "hitam" } },
    { name: "Monokrom", head: { shape: "kotak", color: "putih" }, body: [{ shape: "bola", color: "krem" }, { shape: "cincin", color: "hitam" }, { shape: "bola", color: "krem" }], base: { shape: "bulat", color: "hitam" } },
    { name: "Blush", head: { shape: "plisir", color: "gading" }, body: [{ shape: "cincin", color: "salmon" }, { shape: "bola", color: "krem" }], base: { shape: "bunga", color: "salmon" } },
    { name: "Kayu manis", head: { shape: "kerucut", color: "gading" }, body: [{ shape: "silinder", color: "krem" }], base: { shape: "segitiga", color: "bata" } },
  ],
  photos: {},
};
