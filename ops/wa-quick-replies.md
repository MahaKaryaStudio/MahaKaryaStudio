# Sistem admin WhatsApp — MahaKarya Studio (1 admin, WhatsApp Business)

Tiga bagian: **(1) pengaturan sekali** di aplikasi WhatsApp Business, **(2) alur dan batas waktu**, **(3) teks quick reply** yang sama persis dengan template di `admin.html`.

## 1. Pengaturan sekali di WhatsApp Business

Buka *Pengaturan → Alat bisnis*.

| Alat | Isi |
|---|---|
| **Profil bisnis** | Nama "MahaKarya Studio", kategori *Dekorasi rumah*, jam 09.00–21.00 WIB setiap hari, alamat kota, email, tautan website, Instagram. Foto profil: ikon Nyala. |
| **Pesan sapaan** (greeting) | Kirim ke: *Semua orang*. Teks: lihat **G1**. |
| **Pesan di luar jam kerja** (away) | Jadwal: *Di luar jam kerja*, jam kerja 09.00–21.00. Teks: lihat **G2**. |
| **Balasan cepat** (quick replies) | Tambahkan 12 teks di bagian 3, dengan pintasan persis seperti kolom *Pintasan*. Di chat, ketik `/` lalu pintasannya. |
| **Label** | Buat 7 label dengan urutan dan warna ini: 🟡 `1 Baru` · 🔵 `2 Konfirmasi` · 🟠 `3 Tunggu bayar` · 🟣 `4 Cetak` · 🟢 `5 Dikirim` · ⚪ `6 Selesai` · 🔴 `Batal`. Angka di depan membuat urutannya rapi di filter. |
| **Katalog** | Opsional. Isi 5 preset dari website dengan harga paket dan tautan ke `index.html#rakit`. Jangan isi 12 bagian satuan di katalog WA; pembeli jadi memesan tanpa kode. |
| **Tautan singkat** | *Alat bisnis → Tautan singkat*: aktifkan, pesan default "Halo MahaKarya Studio, saya mau tanya lampu rakitan". Pakai tautan ini di bio Instagram. |

Nomor bisnis dipakai **hanya** untuk bisnis. Pindahkan ke HP kedua bila perlu; WhatsApp Business bisa dibuka juga di laptop lewat *Perangkat tertaut* untuk membalas lebih cepat saat mengetik template panjang.

## 2. Alur pesanan dan batas waktu

| Tahap | Label | Yang dilakukan admin | Batas waktu | Quick reply |
|---|---|---|---|---|
| Pesan masuk | 1 Baru | Buka `admin.html`, tempel pesan → *Baca pesan* → simpan. Balas sapaan. | Balas < 15 menit (jam kerja) | `/terima` |
| Cek & tawarkan | 2 Konfirmasi | Cek stok warna. Isi ongkir aktual dari aplikasi kurir. Kirim rincian + total + cara bayar. | < 1 jam | `/konfirmasi`, `/stokhabis`, `/custom` |
| Menunggu bayar | 3 Tunggu bayar | Tidak ada yang dicetak sebelum bukti bayar. Ingatkan **sekali** setelah 24 jam, lalu diam. | 24 jam | `/ingat` |
| Dibayar | 4 Cetak | Catat tanggal bayar; `admin.html` menghitung janji selesai. Cetak per warna (kelompokkan antrean per warna per hari). | 3–5 hari kerja preset, 7–10 custom | `/cetak` |
| Siap kirim | 4 Cetak | Kirim foto rakitan, tunggu "OK". Kemas per bagian. | Hari yang sama setelah OK | `/foto` |
| Dikirim | 5 Dikirim | Catat kurir + resi, kirim ke pembeli. | Hari yang sama | `/resi` |
| Tiba | 6 Selesai | H+3 setelah tiba: tanya kabar, minta foto/ulasan. | H+3 | `/selesai` |
| Komplain | (label tetap) | Minta foto, jawab dalam 1 jam, putuskan: kirim bagian pengganti (cacat cetak ≤30 hari) atau jelaskan. Tidak berdebat di chat. | 1 jam | `/komplain` |
| Batal | Batal | Konfirmasi pembatalan; refund penuh 1×24 jam bila sudah bayar. | 1×24 jam | `/batal` |

Aturan tetap:
- **Semua pesanan punya kode rakitan.** Kalau pembeli memesan lewat teks bebas, minta mereka merakit di website atau rakitkan untuk mereka lalu kirim kodenya.
- **Ongkir** selalu disebut "perkiraan" sampai resi keluar.
- **Foto rakitan sebelum kirim** wajib. Ini janji di website dan pencegah retur paling murah.
- Satu pesan masuk = satu baris di `admin.html`. Tiap Sabtu: *Unduh CSV* → tempel ke tab **Pesanan** di `ops/Pesanan_MahaKarya.xlsx`, lalu *Unduh JSON* sebagai cadangan.
- Cek dua angka tiap Senin di tab **Laporan**: konversi chat → bayar (target ≥ 40%) dan rata-rata bayar → kirim (target ≤ 6 hari preset).

## 3. Teks

Semua placeholder dalam kurung kurawal diisi oleh `admin.html` otomatis; kalau mengetik manual, ganti sendiri.

### G1 — Pesan sapaan (otomatis)

```
Halo! Terima kasih sudah menghubungi MahaKarya Studio 🙂
Kami balas dalam 15 menit pada jam 09.00–21.00 WIB.
Mau pesan lampu? Rakit dulu di website, lalu kirim kodenya ke sini: mahakaryastudio.github.io/MahaKaryaStudio
```

### G2 — Pesan di luar jam kerja (otomatis)

```
Terima kasih pesannya. Saat ini di luar jam layanan (09.00–21.00 WIB); kami balas besok pagi mulai jam 9.
Kalau mau sambil merakit lampu: mahakaryastudio.github.io/MahaKaryaStudio
```

### Quick replies

| Pintasan | Teks |
|---|---|
| `/terima` | Halo {nama}, terima kasih sudah merakit lampunya 🙂 Kode {kode} sudah kami terima. Kami cek stok warna dulu, maksimal 1 jam ya. |
| `/konfirmasi` | Halo {nama}, ini rinciannya:<br>{rincian}<br>Paket {paket}: {harga}<br>Ongkir ke {zona}: {ongkir}<br>*Total {total}*<br>Produksi {produksi} setelah pembayaran, dikirim pakai kurir reguler.<br><br>Pembayaran: transfer BCA xxxx / QRIS (foto terlampir). Kirim bukti transfernya di sini ya, dan alamat lengkap + nomor HP penerima kalau belum. |
| `/ingat` | Halo {nama}, pesanan {kode} masih kami simpan sampai besok jam ini ya. Kalau sudah transfer, kirim buktinya di sini supaya langsung masuk antrean cetak 🙏 |
| `/cetak` | Pembayaran {total} diterima, terima kasih {nama}! Lampu {kode} masuk antrean cetak hari ini. Perkiraan selesai {jadi}; nanti kami kirim foto rakitannya dulu sebelum dikemas. |
| `/foto` | Halo {nama}, ini foto rakitan {kode} sebelum dikemas. Kalau sudah oke, balas "OK" dan kami kirim hari ini. Kalau ada yang kurang pas, bilang saja sekarang, lebih mudah diganti sebelum dikirim. |
| `/resi` | Lampu {kode} sudah dikirim ✅<br>Kurir: {kurir}<br>Resi: {resi}<br>Perkiraan tiba {tiba}. Saat tiba, cek kardusnya dulu sebelum tanda tangan; kalau penyok, foto dulu ya sebelum dibuka. |
| `/selesai` | Halo {nama}, lampunya sudah terpasang? Kalau berkenan, kirim fotonya di ruanganmu, kami senang melihatnya (dan boleh kami tampilkan dengan izin). Bohlam LED maksimal 5 W ya, supaya kap tetap dingin. |
| `/stokhabis` | Halo {nama}, warna {warna} sedang kosong, restok sekitar 5 hari. Pilihannya: (1) tunggu restok, (2) ganti ke warna lain yang ready: {alternatif}, (3) batalkan tanpa potongan. Mau yang mana? |
| `/custom` | Kombinasi {kode} dicetak khusus, jadi produksinya 7–10 hari kerja (bukan 3–5). Harganya tetap sama. Lanjut? |
| `/batal` | Baik {nama}, pesanan {kode} kami batalkan. Kalau sudah ada pembayaran, kami kembalikan penuh ke rekening yang sama dalam 1×24 jam. Terima kasih sudah mampir, kapan pun mau merakit lagi, kodenya masih bisa dipakai. |
| `/komplain` | Maaf ya {nama}, itu tidak seharusnya terjadi. Boleh kirim foto bagian yang bermasalah (dekat dan dari jauh) dan foto kardusnya? Kami cek dan balas dalam 1 jam. Cacat cetak dalam 30 hari kami ganti bagiannya tanpa biaya. |
| `/rakit` | Supaya pas dengan yang kamu mau, rakit dulu di sini ya (pilih bentuk & warna tiap bagian, harga langsung terlihat): mahakaryastudio.github.io/MahaKaryaStudio#rakit — lalu tekan "Pesan via WhatsApp", kodenya otomatis terkirim ke sini. |

Catatan isi:
- Ganti `BCA xxxx` dengan rekening bisnis. Sebaiknya rekening atas nama usaha atau nama yang sama dengan profil WA, agar pembeli tidak ragu.
- Jangan pernah menulis "lampu ber-SNI". Yang ber-SNI/K3L adalah komponen kit kelistrikannya.
- Nada: "kamu", hangat, tanpa huruf kapital semua, maksimal satu emoji per pesan.
