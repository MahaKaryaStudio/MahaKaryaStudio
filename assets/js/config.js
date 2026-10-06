/*
 * KONFIGURASI BISNIS — ubah nilai di file ini saja.
 * Semua harga dalam Rupiah. Angka di bawah adalah ASUMSI AWAL,
 * wajib dikalibrasi dengan biaya riil (filamen, listrik, jam mesin, finishing, packing).
 */
window.MKS_CONFIG = {
  brand: "MahaKarya Studio",
  // Format internasional tanpa "+" dan tanpa spasi.
  whatsapp: "6285110504229",
  email: "mahakaryastudio99@gmail.com",
  instagram: "maha.karyastudioid",
  tokopedia: "https://www.tokopedia.com/",
  shopee: "https://shopee.co.id/",
  // Link toko TikTok Shop (mis. https://www.tiktok.com/@maha.karyastudioid atau link toko). Dikosongkan = tombol disembunyikan.
  tiktok: "",
  city: "Jakarta, Indonesia",
  // Alamat studio & NIB ditampilkan di footer bila diisi (menambah kepercayaan).
  address: "",
  nib: "",
  // Janji waktu balas chat; tampil di bawah tombol pesan dan di footer.
  replyPromise: "Dibalas < 15 menit, 09.00–21.00 WIB",
  // Perkiraan ongkir per zona untuk lampu (kemasan ±25×25×25 cm). ANGKA CONTOH; cek tarif kurir.
  shipping: {
    zones: [
      { id: "jabodetabek", label: "Jabodetabek", price: 20000 },
      { id: "jawa", label: "Pulau Jawa", price: 45000 },
      { id: "luar", label: "Luar Jawa", price: 95000 },
    ],
    note: "Perkiraan; ongkir pasti dikonfirmasi di WhatsApp sebelum bayar.",
  },

  // Ambang gratis ongkir (dipakai sebagai insentif menaikkan nilai order).
  freeShippingMin: 500000,

  // Estimator pesanan custom
  estimator: {
    sizes: [
      { id: "s", label: "Kecil (≤ 12 cm)", base: 85000, hours: 3 },
      { id: "m", label: "Sedang (12–20 cm)", base: 165000, hours: 7 },
      { id: "l", label: "Besar (20–30 cm)", base: 295000, hours: 14 },
    ],
    materials: [
      { id: "pla", label: "PLA Matte (bio-based)", mult: 1.0 },
      { id: "silk", label: "PLA Silk (kilau metalik)", mult: 1.15 },
      { id: "wood", label: "Wood-fill (serat kayu)", mult: 1.3 },
      { id: "petg", label: "PETG (tahan air, outdoor)", mult: 1.2 },
    ],
    finishes: [
      { id: "raw", label: "Natural (tekstur layer)", add: 0 },
      { id: "sand", label: "Diamplas + coating", add: 45000 },
      { id: "paint", label: "Dicat tangan", add: 95000 },
    ],
    designFee: { none: 0, personal: 50000, custom: 350000 },
    // Diskon volume (B2B / souvenir)
    tiers: [
      { min: 1, disc: 0 },
      { min: 10, disc: 0.1 },
      { min: 25, disc: 0.15 },
      { min: 50, disc: 0.2 },
      { min: 100, disc: 0.25 },
    ],
    leadTimeDays: { base: 3, perUnitHours: 1 / 8 },
  },
};
