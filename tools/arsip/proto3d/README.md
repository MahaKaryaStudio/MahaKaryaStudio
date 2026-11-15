# Prototipe lampu 3D (arsip, tidak dipakai situs)

Percobaan tampilan 3D dengan three.js 0.187.0 (`LatheGeometry` dari profil bentuk di
`assets/js/lamp-art.js`). Tidak ada berkas di folder ini yang dimuat situs, dan `tools/`
tidak ikut tayang.

Keputusan: **ditunda dan bergerbang**. Bila kelak dibangun, hanya di studio rakit, dimuat
setelah tombol "Putar 3D" diketuk, gambar SVG tetap bawaan dan cadangan, dan pil
"ILUSTRASI" tetap tampil.

Hasil ukur (Chromium ter-throttle, bukan HP sungguhan):

- Bundel 553 KB mentah, ±141 KB gzip; three.js 97,5% darinya. Itu 1,3 kali seluruh kode
  halaman (±108 KB gzip).
- CPU 4x + Slow 4G: SVG tergambar 1,54 s; frame 3D pertama 3,40 s.
- Saat diam, render 3D tidak lebih baik dari gambar SVG; baru berguna saat diputar, dan
  separuh bentuk bulat sehingga diputar pun tidak menunjukkan hal baru.

Yang belum diketahui dan harus dijawab sebelum dibangun:

1. Frame rate, waktu kompilasi shader, panas, dan memori GPU di HP Android kelas menengah.
2. Denah dan kedalaman asli bentuk yang tidak bulat (bola, kubus, cincin, heksa, alas kotak,
   alas segitiga, kap kotak). Di prototipe ini semuanya asumsi.
3. Perilaku saat pembeli pindah ke WhatsApp lalu kembali (konteks WebGL bisa hilang).

Membangun ulang: `npm i three@0.187.0 esbuild` di folder ini, lalu `sh build.sh`.
`index.html` menampilkan SVG dan 3D berdampingan dan butuh salinan `assets/` repo di `repo/`.
`behave.js`, `measure.js`, `px.js`, `shoot3d.js` adalah uji Playwright-nya.
