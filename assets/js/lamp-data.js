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
  maxBodies: 3,
  colors: [
    { id: "salmon", name: "Salmon", hex: "#e8836f" },
    { id: "lavender", name: "Lavender", hex: "#b79ad6" },
    { id: "zaitun", name: "Zaitun", hex: "#5c8040" },
    { id: "jingga", name: "Jingga", hex: "#ea7f31" },
    { id: "bata", name: "Merah bata", hex: "#c4522f" },
    { id: "krem", name: "Krem", hex: "#efe3cb" },
    { id: "hitam", name: "Hitam", hex: "#2b2622" },
    { id: "kunyit", name: "Kunyit", hex: "#e2b43c" },
    { id: "merahmuda", name: "Merah muda", hex: "#e6a3bd" },
  ],
  shadeColors: [
    { id: "gading", name: "Gading", hex: "#f3e8d1" },
    { id: "putih", name: "Putih", hex: "#f8f5ee" },
    { id: "kuning", name: "Kuning pucat", hex: "#f6e6b3" },
  ],
  heads: [
    { id: "plisir", name: "Silinder plisir", price: 189000, cm: 14 },
    { id: "kerucut", name: "Kerucut", price: 189000, cm: 13 },
    { id: "kotak", name: "Kotak", price: 199000, cm: 13 },
  ],
  bodies: [
    { id: "bola", name: "Bola", price: 72000, cm: 8, kg: 0.18 },
    { id: "kubus", name: "Kubus", price: 72000, cm: 7, kg: 0.17 },
    { id: "cincin", name: "Cincin", price: 59000, cm: 4.5, kg: 0.12 },
    { id: "heksa", name: "Heksagon", price: 79000, cm: 7.5, kg: 0.19 },
    { id: "silinder", name: "Silinder", price: 65000, cm: 6, kg: 0.15 },
  ],
  bases: [
    { id: "bulat", name: "Bulat", price: 85000 },
    { id: "segitiga", name: "Segitiga", price: 85000 },
    { id: "kotak", name: "Kotak", price: 85000 },
    { id: "bunga", name: "Bunga", price: 99000 },
  ],
  packages: {
    3: { name: "Trio", disc: 0.3, cm: "24–30", note: "Pas untuk meja samping tempat tidur" },
    4: { name: "Kuarto", disc: 0.35, cm: "30–38", note: "Paling sering dipesan, untuk meja kerja" },
    5: { name: "Kuinto", disc: 0.38, cm: "36–46", note: "Paling tinggi, untuk sudut ruang tamu" },
  },
  presets: [
    { name: "Senja", head: { shape: "kerucut", color: "gading" }, body: [{ shape: "kubus", color: "bata" }, { shape: "heksa", color: "kunyit" }, { shape: "bola", color: "jingga" }], base: { shape: "kotak", color: "bata" } },
    { name: "Kebun", head: { shape: "plisir", color: "gading" }, body: [{ shape: "bola", color: "zaitun" }, { shape: "cincin", color: "merahmuda" }, { shape: "kubus", color: "lavender" }], base: { shape: "bulat", color: "hitam" } },
    { name: "Monokrom", head: { shape: "kotak", color: "putih" }, body: [{ shape: "bola", color: "krem" }, { shape: "cincin", color: "hitam" }, { shape: "bola", color: "krem" }], base: { shape: "bulat", color: "hitam" } },
    { name: "Permen", head: { shape: "plisir", color: "kuning" }, body: [{ shape: "cincin", color: "merahmuda" }, { shape: "bola", color: "lavender" }], base: { shape: "bunga", color: "salmon" } },
    { name: "Kayu manis", head: { shape: "kerucut", color: "gading" }, body: [{ shape: "silinder", color: "krem" }], base: { shape: "segitiga", color: "bata" } },
  ],
  photos: {},
};
